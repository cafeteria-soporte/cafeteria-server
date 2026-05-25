export class MovementResponseDto {
  id: number;
  createdAt: Date;
  productId: number;
  productName: string;
  categoryName: string;
  movementType: string;
  quantity: number;
  resultingStock: number;
  estimatedValue: number;
  reason: string;
  registeredBy: string;
}
