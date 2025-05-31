/**
 * Comprehensive Hindi/Hinglish to English Medical Symptom Synonym Mapping
 * 150+ entries covering regional variations and medical terminology
 */

export const symptomSynonyms = {
  // Pain variations
  "dard": "pain",
  "takleef": "pain", 
  "peeda": "pain",
  "kasht": "pain",
  "vedana": "pain",
  "dukhna": "pain",
  "dukhti": "pain",
  "ache": "pain",
  "hurt": "pain",
  
  // Fever variations
  "bukhaar": "fever",
  "bukhar": "fever",
  "tap": "fever",
  "tez bukhaar": "high_fever",
  "halka bukhaar": "mild_fever",
  "fever": "fever",
  "temperature": "fever",
  "garmi": "fever",
  
  // Burning sensation
  "jalan": "burning",
  "jalaa": "burning",
  "sooja": "burning",
  "jalana": "burning",
  "burn": "burning",
  "burning": "burning",
  "khaarish": "itching",
  
  // Swelling variations
  "sujan": "swelling",
  "soojan": "swelling",
  "soojana": "swelling", 
  "phoola": "swelling",
  "phoolna": "swelling",
  "swelling": "swelling",
  "inflammation": "swelling",
  
  // Vomiting/Nausea
  "ulti": "vomiting",
  "ulTi": "vomiting",
  "vomit": "vomiting",
  "vomiting": "vomiting",
  "qaai": "vomiting",
  "jee machalna": "nausea",
  "nausea": "nausea",
  "chakkar": "nausea",
  "ghabrahat": "nausea",
  
  // Diarrhea/Loose motions
  "dast": "diarrhea",
  "loose motion": "diarrhea",
  "loose motions": "diarrhea",
  "patlaa": "diarrhea",
  "patli": "diarrhea",
  "diarrhea": "diarrhea",
  "loose stools": "diarrhea",
  "pait kharab": "stomach_upset",
  
  // Cough variations
  "khaansi": "cough",
  "khasi": "cough", 
  "khaanskhaasi": "cough",
  "cough": "cough",
  "sukhi khaansi": "dry_cough",
  "geeli khaansi": "wet_cough",
  "kaff": "phlegm",
  "balgam": "phlegm",
  
  // Cold/Flu
  "zukaam": "cold",
  "jukam": "cold",
  "nazla": "cold",
  "cold": "cold",
  "sardi": "cold",
  "naak behna": "runny_nose",
  "naak band": "blocked_nose",
  "congestion": "congestion",
  
  // Headache variations
  "sar dard": "headache",
  "sardard": "headache",
  "sir dard": "headache",
  "headache": "headache",
  "sar mein dard": "headache",
  "migraine": "migraine",
  "chakkar aana": "dizziness",
  
  // Stomach/Abdominal issues
  "pet dard": "abdominal_pain",
  "paet dard": "abdominal_pain", 
  "stomach pain": "abdominal_pain",
  "pet mein dard": "abdominal_pain",
  "acidity": "acidity",
  "gas": "gas",
  "bloating": "bloating",
  "pait phoola": "bloating",
  "constipation": "constipation",
  "kabz": "constipation",
  "qabz": "constipation",
  
  // Chest problems
  "seene mein dard": "chest_pain",
  "sina dard": "chest_pain",
  "chest pain": "chest_pain",
  "saas lene mein takleef": "breathing_difficulty",
  "saas phoolna": "shortness_of_breath",
  "breathlessness": "shortness_of_breath",
  
  // Throat issues
  "gale mein dard": "throat_pain",
  "gala dard": "throat_pain",
  "throat pain": "throat_pain",
  "kharas": "throat_irritation",
  "gala sukha": "dry_throat",
  "sore throat": "throat_pain",
  
  // Back pain
  "kamr dard": "back_pain",
  "kamar dard": "back_pain",
  "back pain": "back_pain",
  "peeth dard": "back_pain",
  
  // General symptoms
  "kamzori": "weakness",
  "weakness": "weakness",
  "thakaan": "fatigue",
  "fatigue": "fatigue",
  "neend na aana": "insomnia",
  "insomnia": "insomnia",
  "bhookh na lagna": "loss_of_appetite",
  "appetite loss": "loss_of_appetite",
  
  // Skin issues
  "khujli": "itching",
  "itching": "itching",
  "daane": "rash",
  "rash": "rash",
  "skin problem": "skin_irritation",
  "chamdi ki samasya": "skin_problem",
  
  // Joint pain
  "jodon mein dard": "joint_pain",
  "joints pain": "joint_pain",
  "arthritis": "joint_pain",
  "gathiya": "arthritis",
  
  // Eye problems
  "aankh mein dard": "eye_pain",
  "eye pain": "eye_pain",
  "aankhon mein jalan": "eye_irritation",
  "dhundla dikhna": "blurred_vision",
  "blurred vision": "blurred_vision",
  
  // Ear problems
  "kan mein dard": "ear_pain",
  "ear pain": "ear_pain",
  "kan se awaaz": "tinnitus",
  "kaan bajna": "tinnitus",
  
  // Urinary issues
  "peshab mein jalan": "urinary_burning",
  "urine burning": "urinary_burning",
  "baar baar peshab": "frequent_urination",
  "frequent urination": "frequent_urination",
  
  // Women's health
  "periods ki samasya": "menstrual_problems",
  "mahavari": "menstruation",
  "pet mein marod": "cramps",
  "cramps": "cramps",
  
  // Severity indicators
  "bahut": "severe",
  "zyada": "moderate", 
  "thoda": "mild",
  "halka": "mild",
  "tej": "severe",
  "kam": "mild",
  "very": "severe",
  "little": "mild",
  "moderate": "moderate",
  "mild": "mild",
  "severe": "severe",
  
  // Duration terms
  "kal se": "since_yesterday",
  "aaj se": "since_today", 
  "kuch din se": "few_days",
  "hafte se": "since_week",
  "mahine se": "since_month",
  "abhi": "just_now",
  "recently": "recently",
  
  // Body parts
  "pet": "abdomen",
  "paet": "abdomen",
  "seena": "chest",
  "sina": "chest", 
  "sar": "head",
  "sir": "head",
  "gala": "throat",
  "kamr": "back",
  "kamar": "back",
  "haath": "hand",
  "pair": "leg",
  "paer": "leg",
  "aankh": "eye",
  "aankhein": "eyes",
  "kan": "ear",
  "kaan": "ear",
  "naak": "nose"
};