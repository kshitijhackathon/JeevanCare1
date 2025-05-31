import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TestConsultation() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-sm p-4 flex items-center mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">AI Consultation Test</h1>
      </div>

      <div className="bg-white rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Consultation Page Working!
        </h2>
        <p className="text-gray-600 mb-4">
          Great! The navigation is working properly. Now we can implement the full consultation flow.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}