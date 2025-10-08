# High-Performance Image Similarity Search Engine

![Project Demo](assets/demo.gif)

A full-stack application that finds visually similar images from a large dataset using a custom high-performance C backend and an interactive web frontend. This project demonstrates a powerful combination of low-level data structures, modern machine learning pipelines, and web-based data visualization.

---
## Tech Stack & Core Concepts

This project is divided into three main components:

1.  **🤖 The AI Data Pipeline (Python & PyTorch)**
    - Uses a pre-trained **Convolutional Neural Network (MobileNetV2)** for high-dimensional feature extraction via **Transfer Learning**.
    - Each image is converted into a 1280-dimensional feature vector (embedding) that numerically represents its visual content.
    - Employs **PCA** or **t-SNE** to reduce the 1280-D vectors down to 3 dimensions for visualization.

2.  **⚙️ The High-Performance Backend (C & Mongoose)**
    - A lightweight web server built in pure **C** using the `mongoose` library serves as the application's backend API.
    - At its core is a **k-d tree** data structure, implemented from scratch, to index all 5,000 image vectors.
    - This allows for an extremely fast **nearest-neighbor search**, using an intelligent pruning algorithm to find the most similar image without a slow brute-force scan.

3.  **🎨 The Interactive Frontend (HTML, CSS, JS)**
    - A responsive user interface built with modern web technologies.
    - **D3.js** is used to render a conceptual 2D visualization of the k-d tree's spatial partitioning.
    - **Plotly.js** provides a fully interactive 3D scatter plot, allowing users to rotate, pan, and zoom through the clustered image data in 3D space.

---
## Features

-   **Fast Similarity Search:** Find the closest vector match from a 5,000-point dataset in real-time.
-   **Interactive 3D Cluster Visualization:** Explore the relationships between images in a 3D space.
-   **Conceptual 2D k-d Tree Plot:** See a visual representation of the core search algorithm.
-   **Full-Stack Architecture:** A clear separation between the C backend, Python data pipeline, and JavaScript frontend.
-   **Efficient Data Handling:** Uses **Git LFS** to manage the large feature vector datasets.

---
## Project Structure

```
image-similarity-search/
├── assets/
│   └── demo.gif             # Project demo GIF
├── c_search/              # C program for the k-d tree search server
│   ├── src/                 # .c source files (main.c, kdtree.c, mongoose.c)
│   ├── include/             # .h header files
│   ├── data/                # .csv files (vectors.csv, 3d_coords.csv)
│   └── Makefile
├── frontend/              # Web UI files
│   ├── assets/              # Background image
│   ├── images/              # Dataset images (PNGs)
│   ├── index.html
│   ├── script.js
│   └── style.css
├── python_extractor/      # Python scripts for data generation
│   ├── extract_features.py
│   ├── generate_3d_coords.py
│   └── requirements.txt
│
└── README.md
```

---
## Setup and Usage

### Prerequisites
- A C compiler (like **GCC**) and **`make`**.
- **Python 3.8+** and `pip`.
- **Git LFS** (`git lfs install`).

### Workflow

Follow these steps from the project's root directory.

**1. Set up the Python Environment**
This only needs to be done once.
```bash
cd python_extractor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**2. Generate the Data Files**
Run the two Python scripts to process the images and create the data files for the C backend.
```bash
# Still in python_extractor/ with venv active
# This script creates vectors.csv and extracts images to frontend/images/
python extract_features.py

# This script creates 3d_coords.csv for the 3D plot
python generate_3d_coords.py
```

**3. Compile the C Backend**
```bash
# Navigate to the C directory from the project root
cd ../c_search

# Compile the server
make
```

**4. Run the Application**
```bash
# Navigate back to the project root
cd ..

# Run the C web server
./c_search/bin/search_app
```

**5. View the Frontend**
Open your web browser and navigate to: **`http://localhost:8000`**

---
## Future Work

-   **Image Upload:** Allow users to upload their own image for querying instead of using an ID.
-   **K-Nearest Neighbors:** Extend the algorithm to find and display the top *K* similar images.
-   **Index Comparison:** Implement other spatial data structures (like VP-Trees) to compare performance against the k-d tree.
