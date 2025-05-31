import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BodyPart {
  id: string;
  name: string;
  hindiName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BodyModelProps {
  onPainPointSelect: (bodyPart: string, location: { x: number; y: number }) => void;
  selectedParts: string[];
}

export function BodyModel3D({ onPainPointSelect, selectedParts }: BodyModelProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const bodyParts: BodyPart[] = [
    { id: 'head', name: 'Head', hindiName: 'सिर', x: 45, y: 5, width: 10, height: 15 },
    { id: 'neck', name: 'Neck', hindiName: 'गर्दन', x: 47, y: 20, width: 6, height: 8 },
    { id: 'chest', name: 'Chest', hindiName: 'छाती', x: 40, y: 30, width: 20, height: 20 },
    { id: 'stomach', name: 'Stomach', hindiName: 'पेट', x: 42, y: 50, width: 16, height: 15 },
    { id: 'left_shoulder', name: 'Left Shoulder', hindiName: 'बायां कंधा', x: 25, y: 30, width: 15, height: 12 },
    { id: 'right_shoulder', name: 'Right Shoulder', hindiName: 'दायां कंधा', x: 60, y: 30, width: 15, height: 12 },
    { id: 'left_arm', name: 'Left Arm', hindiName: 'बायां हाथ', x: 15, y: 45, width: 12, height: 25 },
    { id: 'right_arm', name: 'Right Arm', hindiName: 'दायां हाथ', x: 73, y: 45, width: 12, height: 25 },
    { id: 'left_leg', name: 'Left Leg', hindiName: 'बायां पैर', x: 40, y: 70, width: 8, height: 25 },
    { id: 'right_leg', name: 'Right Leg', hindiName: 'दायां पैर', x: 52, y: 70, width: 8, height: 25 },
    { id: 'back', name: 'Back', hindiName: 'पीठ', x: 42, y: 35, width: 16, height: 25 }
  ];

  const handleBodyPartClick = (bodyPart: BodyPart, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    onPainPointSelect(bodyPart.id, { x, y });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-center mb-4">
          दर्द की जगह बताएं / Point to Pain Area
        </h3>
        
        <div className="relative">
          {/* 3D-like Body SVG */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-80 border rounded-lg bg-gradient-to-b from-blue-50 to-white"
            style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
          >
            {/* Body outline */}
            <path
              d="M45 5 Q50 2 55 5 L55 20 Q60 25 60 30 L75 30 L75 45 L85 45 L85 70 L75 70 L60 65 L60 70 L52 70 L52 95 L48 95 L48 70 L40 70 L40 65 L25 70 L15 70 L15 45 L25 45 L40 30 Q40 25 45 20 Z"
              fill="rgba(255, 220, 177, 0.8)"
              stroke="#8B4513"
              strokeWidth="0.5"
            />

            {/* Interactive body parts */}
            {bodyParts.map((part) => (
              <g key={part.id}>
                <rect
                  x={part.x}
                  y={part.y}
                  width={part.width}
                  height={part.height}
                  fill={selectedParts.includes(part.id) ? 'rgba(255, 0, 0, 0.6)' : 'transparent'}
                  stroke={hoveredPart === part.id ? '#FF0000' : 'transparent'}
                  strokeWidth="2"
                  rx="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                  onClick={(e) => handleBodyPartClick(part, e)}
                />
                
                {/* Pain indicators */}
                {selectedParts.includes(part.id) && (
                  <g>
                    <circle
                      cx={part.x + part.width / 2}
                      cy={part.y + part.height / 2}
                      r="2"
                      fill="#FF0000"
                      className="animate-pulse"
                    />
                    <circle
                      cx={part.x + part.width / 2}
                      cy={part.y + part.height / 2}
                      r="4"
                      fill="none"
                      stroke="#FF0000"
                      strokeWidth="1"
                      className="animate-ping"
                    />
                  </g>
                )}
              </g>
            ))}

            {/* Body part labels */}
            <text x="50" y="12" textAnchor="middle" fontSize="3" fill="#333">सिर</text>
            <text x="50" y="40" textAnchor="middle" fontSize="3" fill="#333">छाती</text>
            <text x="50" y="58" textAnchor="middle" fontSize="3" fill="#333">पेट</text>
          </svg>
        </div>

        {/* Selected parts display */}
        {selectedParts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">दर्द की जगह / Pain Areas:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedParts.map((partId) => {
                const part = bodyParts.find(p => p.id === partId);
                return (
                  <Badge key={partId} variant="destructive">
                    {part?.hindiName} / {part?.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Hovering part display */}
        {hoveredPart && (
          <div className="mt-2 text-center">
            <Badge variant="outline">
              {bodyParts.find(p => p.id === hoveredPart)?.hindiName} / 
              {bodyParts.find(p => p.id === hoveredPart)?.name}
            </Badge>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          दर्द की जगह पर टैप करें / Tap on areas where you feel pain
        </div>
      </CardContent>
    </Card>
  );
}