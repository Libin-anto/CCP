from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
import os

class NLPService:
    def __init__(self):
        # Load lightweight model for embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        self.index_file = "kms_faiss.index"
        self.map_file = "kms_doc_map.pkl"
        
        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)
            with open(self.map_file, "rb") as f:
                self.doc_map = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.doc_map = {} # Map index ID to Document ID

    def generate_embedding(self, text: str):
        return self.model.encode([text])[0]

    def add_to_index(self, doc_id: str, text: str):
        # Chunk text if needed, for now using full text or summary
        vector = self.model.encode([text])
        faiss.normalize_L2(vector)
        
        self.index.add(vector)
        idx_id = self.index.ntotal - 1
        self.doc_map[idx_id] = doc_id
        
        # Save persistence
        self.save_index()
        
        return idx_id

    def search(self, query: str, top_k: int = 5):
        query_vector = self.model.encode([query])
        faiss.normalize_L2(query_vector)
        
        distances, indices = self.index.search(query_vector, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx in self.doc_map:
                results.append({
                    "doc_id": self.doc_map[idx],
                    "score": float(distances[0][i])
                })
        return results

    def save_index(self):
        faiss.write_index(self.index, self.index_file)
        with open(self.map_file, "wb") as f:
            pickle.dump(self.doc_map, f)

nlp_service = NLPService()
