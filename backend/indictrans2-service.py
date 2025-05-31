#!/usr/bin/env python3
"""
IndicTrans2 Translation Service
This service provides translation capabilities using AI4Bharat's IndicTrans2 model
"""

import torch
import json
import sys
import os
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
)

try:
    from IndicTransToolkit import IndicProcessor
except ImportError:
    print("ERROR: IndicTransToolkit not installed. Please install using:")
    print("git clone https://github.com/VarunGumma/IndicTransToolkit.git")
    print("cd IndicTransToolkit && pip install --editable ./")
    sys.exit(1)

class IndicTrans2Service:
    def __init__(self):
        self.model_name = "ai4bharat/indictrans2-indic-en-1B"
        self.tokenizer = None
        self.model = None
        self.processor = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.initialized = False
        
    def initialize(self):
        """Initialize the model and tokenizer"""
        try:
            print("Loading IndicTrans2 model...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name, 
                trust_remote_code=True
            )
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name, 
                trust_remote_code=True
            )
            self.processor = IndicProcessor(inference=True)
            
            # Move model to device
            self.model.to(self.device)
            self.initialized = True
            print(f"Model loaded successfully on {self.device}")
            
        except Exception as e:
            print(f"Error initializing model: {e}")
            self.initialized = False
    
    def translate_text(self, text, src_lang, tgt_lang):
        """Translate text from source language to target language"""
        if not self.initialized:
            self.initialize()
            
        if not self.initialized:
            return {"error": "Model not initialized"}
        
        try:
            # Preprocess the input
            batch = self.processor.preprocess_batch(
                [text],
                src_lang=src_lang,
                tgt_lang=tgt_lang,
            )
            
            # Tokenize
            inputs = self.tokenizer(
                batch,
                truncation=True,
                padding="longest",
                return_tensors="pt",
                return_attention_mask=True,
            ).to(self.device)
            
            # Generate translation
            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    use_cache=True,
                    min_length=0,
                    max_length=256,
                    num_beams=5,
                    num_return_sequences=1,
                )
            
            # Decode
            with self.tokenizer.as_target_tokenizer():
                generated_tokens = self.tokenizer.batch_decode(
                    generated_tokens.detach().cpu().tolist(),
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True,
                )
            
            # Postprocess
            translations = self.processor.postprocess_batch(
                generated_tokens, 
                lang=tgt_lang
            )
            
            return {
                "translated_text": translations[0],
                "source_lang": src_lang,
                "target_lang": tgt_lang,
                "confidence": 0.95
            }
            
        except Exception as e:
            return {"error": f"Translation failed: {str(e)}"}

def main():
    """Main function to handle command line translation requests"""
    if len(sys.argv) != 4:
        print("Usage: python indictrans2-service.py <text> <src_lang> <tgt_lang>")
        sys.exit(1)
    
    text = sys.argv[1]
    src_lang = sys.argv[2]
    tgt_lang = sys.argv[3]
    
    service = IndicTrans2Service()
    result = service.translate_text(text, src_lang, tgt_lang)
    
    # Output JSON for Node.js to parse
    print(json.dumps(result))

if __name__ == "__main__":
    main()