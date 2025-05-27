export interface HealthMetrics {
  heartRate: number;
  bloodGroup: string;
  weight: string;
}

export interface CartItemWithProduct {
  id: number;
  userId: string;
  productId: number;
  quantity: number;
  createdAt: string;
  product: {
    id: number;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    category: string;
    inStock: boolean;
    rating: string;
    isOnSale: boolean;
  };
}

export interface ConsultationRequest {
  symptoms: string;
  scheduledAt?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  hasRecorded: boolean;
  transcript: string;
}
