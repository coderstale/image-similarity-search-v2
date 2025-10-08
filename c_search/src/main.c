#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>     
#include <float.h> 
#include "kdtree.h"
#include "mongoose.h" 

#define NUM_POINTS 5000
#define FILENAME "c_search/data/vectors.csv" 

static struct Point* g_points = NULL;
static struct KDNode* g_root = NULL;

struct Point* load_points_from_csv(const char* filename, int num_points) {
    FILE* fp = fopen(filename, "r");
    if (fp == NULL) { perror("Failed to open file"); return NULL; }

    struct Point* points = (struct Point*)malloc(num_points * sizeof(struct Point));
    if (points == NULL) { perror("Failed to allocate memory"); fclose(fp); return NULL; }

    char line[30000]; 
    for (int i = 0; i < num_points; i++) {
        if (fgets(line, sizeof(line), fp) == NULL) {
            fprintf(stderr, "Error: File ended prematurely at line %d\n", i + 1);
            free(points); fclose(fp); return NULL;
        }
        points[i].id = i;
        char* saveptr; 
        char* token = strtok_r(line, ",", &saveptr);
        if (token == NULL) {
            fprintf(stderr, "Error: Malformed or empty line at line %d\n", i + 1);
            free(points); fclose(fp); return NULL;
        }
        points[i].label = atoi(token);
        for (int j = 0; j < K_DIM; j++) {
            token = strtok_r(NULL, ",", &saveptr);
            if (token == NULL) {
                fprintf(stderr, "Error: Incomplete vector at line %d\n", i + 1);
                free(points); fclose(fp); return NULL;
            }
            points[i].vec[j] = atof(token);
        }
    }
    fclose(fp);
    return points;
}

static void fn(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *) ev_data;

        if (mg_strcmp(hm->uri, mg_str("/api/search")) == 0) {
            char id_str[10] = {0};
            mg_http_get_var(&hm->query, "id", id_str, sizeof(id_str));
            int query_id = atoi(id_str);
            if (query_id < 0 || query_id >= NUM_POINTS) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{ \"error\": \"Invalid ID\" }");
                return;
            }
            
            struct Point* target = NULL;
            for (int i = 0; i < NUM_POINTS; i++) {
                if (g_points[i].id == query_id) { target = &g_points[i]; break; }
            }
            
            if (target != NULL) {
                struct KDNode* best_node = NULL;
                double best_dist = DBL_MAX;
                nearest_neighbor_search(g_root, target, &best_node, &best_dist);
                if (best_node != NULL) {
                     mg_http_reply(c, 200, "Content-Type: application/json\r\n",
                          "{ \"queryId\": %d, \"queryLabel\": %d, \"matchId\": %d, \"matchLabel\": %d, \"distance\": %.4f }",
                          target->id, target->label, best_node->pt.id, best_node->pt.label, sqrt(best_dist));
                } else {
                    mg_http_reply(c, 404, "Content-Type: application/json\r\n", "{ \"error\": \"No similar image found\" }");
                }
            } else {
                 mg_http_reply(c, 404, "Content-Type: application/json\r\n", "{ \"error\": \"Query ID not found\" }");
            }
        
        } else if (mg_strcmp(hm->uri, mg_str("/api/tree-data")) == 0) {
            const char *tree_json = "{\"point\":[50,50],\"axis\":0,\"left\":{\"point\":[25,75],\"axis\":1,\"left\":{\"point\":[10,60],\"axis\":0, \"left\":null, \"right\":null},\"right\":{\"point\":[40,90],\"axis\":0, \"left\":null, \"right\":null}},\"right\":{\"point\":[80,25],\"axis\":1,\"left\":{\"point\":[70,10],\"axis\":0, \"left\":null, \"right\":null},\"right\":{\"point\":[90,40],\"axis\":0, \"left\":null, \"right\":null}}}";
            mg_http_reply(c, 200, "Content-Type: application/json\r\n", tree_json);
        }
        
        else if (mg_strcmp(hm->uri, mg_str("/api/3d-data")) == 0) {
            struct mg_http_serve_opts opts = {0};
            mg_http_serve_file(c, hm, "c_search/data/3d_coords.csv", &opts);
        }
        
        else {
            struct mg_http_serve_opts opts = {.root_dir = "frontend"};
            mg_http_serve_dir(c, hm, &opts);
        }
    }
}

int main(void) {
    printf("Loading data from %s...\n", FILENAME);
    g_points = load_points_from_csv(FILENAME, NUM_POINTS);
    if (g_points == NULL) return 1;
    printf("Data loaded. Building k-d tree for %d points...\n", NUM_POINTS);

    struct Point* points_for_tree = (struct Point*)malloc(NUM_POINTS * sizeof(struct Point));
    if (points_for_tree == NULL) {
        perror("Failed to allocate memory for tree copy");
        free(g_points);
        return 1;
    }
    memcpy(points_for_tree, g_points, NUM_POINTS * sizeof(struct Point));
    
    g_root = build_kdtree(points_for_tree, NUM_POINTS, 0);
    
    free(points_for_tree);
    
    printf("k-d tree built successfully.\n");
    
    struct mg_mgr mgr;
    mg_mgr_init(&mgr);
    mg_http_listen(&mgr, "http://0.0.0.0:8000", fn, NULL);
    printf("Server started on http://localhost:8000\n");

    for (;;) {
        // poll frequently for a responsive server 
        mg_mgr_poll(&mgr, 1);
    }
    
    mg_mgr_free(&mgr);
    free_kdtree(g_root);
    free(g_points);
    return 0;
}