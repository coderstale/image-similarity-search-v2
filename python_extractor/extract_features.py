import torch
import torchvision.models as models
import torchvision.transforms as transforms
import torchvision.datasets as datasets
from torch.utils.data import DataLoader
import numpy as np
import os
from tqdm import tqdm
from PIL import Image

OUTPUT_FILE_PATH = '../c_search/data/vectors.csv'
DATASET_DIR = './dataset'
IMAGE_SAVE_DIR = '../frontend/images' # <--- New path to save images
NUM_IMAGES = 5000
NUM_IMAGES_TO_SAVE = 5000
BATCH_SIZE = 64

def get_device():
    if torch.backends.mps.is_available(): return torch.device("mps")
    elif torch.cuda.is_available(): return torch.device("cuda")
    else: return torch.device("cpu")

def get_model(device):
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    feature_extractor = torch.nn.Sequential(model.features, torch.nn.AdaptiveAvgPool2d((1, 1))).to(device)
    feature_extractor.eval()
    return feature_extractor

def extract_features(model, dataloader, device):
    all_features, all_labels = [], []
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Extracting Features"):
            images = images.to(device)
            features = model(images).squeeze(-1).squeeze(-1)
            all_features.append(features.cpu().numpy())
            all_labels.append(labels.cpu().numpy())
    return np.vstack(all_features), np.concatenate(all_labels)

def save_images_as_png(dataset, num_to_save, save_dir):
    print(f"Saving first {num_to_save} images to {save_dir}...")
    os.makedirs(save_dir, exist_ok=True)
    for i in tqdm(range(num_to_save), desc="Saving Images"):

        image, _ = dataset[i] 
        image.save(os.path.join(save_dir, f"{i}.png"))
    print("Images saved successfully.")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_FILE_PATH), exist_ok=True)
    
    device = get_device()
    print(f"Using {str(device).upper()} device.")
    
    model = get_model(device)
    
    feature_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
 
    print("Loading STL10 dataset...")

    original_dataset = datasets.STL10(root=DATASET_DIR, split='train', download=True, transform=None)
    transformed_dataset = datasets.STL10(root=DATASET_DIR, split='train', download=False, transform=feature_transform)
   
    
    save_images_as_png(original_dataset, NUM_IMAGES_TO_SAVE, IMAGE_SAVE_DIR)
    
    subset_dataset = torch.utils.data.Subset(transformed_dataset, range(NUM_IMAGES))
    dataloader = DataLoader(subset_dataset, batch_size=BATCH_SIZE, shuffle=False)
    print(f"Dataset loaded. Processing {NUM_IMAGES} images for feature extraction.")

    features, labels = extract_features(model, dataloader, device)
    
    print(f"\nSaving {len(features)} feature vectors to {OUTPUT_FILE_PATH}...")
    data_to_save = np.hstack((labels[:, np.newaxis], features))
    np.savetxt(OUTPUT_FILE_PATH, data_to_save, delimiter=',', fmt='%.8f')
    
    print("\n✅ All tasks complete!")