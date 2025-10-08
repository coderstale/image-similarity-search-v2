import numpy as np
from sklearn.decomposition import PCA
from tqdm import tqdm
import os

VECTORS_FILE_PATH = '../c_search/data/vectors.csv'
OUTPUT_3D_COORDS_PATH = '../c_search/data/3d_coords.csv'

NUM_POINTS_TO_PROCESS = 5000 

if __name__ == "__main__":
    print(f"Loading vectors from {VECTORS_FILE_PATH}...")
    if not os.path.exists(VECTORS_FILE_PATH):
        print(f"Error: {VECTORS_FILE_PATH} not found. Please run extract_features.py first.")
        exit()

    all_data = np.loadtxt(VECTORS_FILE_PATH, delimiter=',')
    if NUM_POINTS_TO_PROCESS > len(all_data):
        NUM_POINTS_TO_PROCESS = len(all_data)
        
    labels = all_data[:NUM_POINTS_TO_PROCESS, 0].astype(int)
    vectors = all_data[:NUM_POINTS_TO_PROCESS, 1:]

    print(f"Loaded {len(vectors)} vectors. Running PCA to reduce to 3 dimensions...")
    
    pca = PCA(n_components=3)
    
    coords_3d = pca.fit_transform(vectors)
    
    print(f"\nSaving {len(coords_3d)} 3D coordinates to {OUTPUT_3D_COORDS_PATH}...")
    
    ids = np.arange(NUM_POINTS_TO_PROCESS)
    data_to_save = np.hstack((ids[:, np.newaxis], labels[:, np.newaxis], coords_3d))
    
    # Use specific formats: %d for integer IDs/labels, %.4f for float coordinates
    np.savetxt(OUTPUT_3D_COORDS_PATH, data_to_save, delimiter=',', fmt=['%d', '%d', '%.4f', '%.4f', '%.4f'], header='id,label,x,y,z', comments='')
    
    print("\n✅ 3D coordinate generation complete!")