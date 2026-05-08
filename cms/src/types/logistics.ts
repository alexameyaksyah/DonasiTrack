export type ShipmentStatus = "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

export const SHIPMENT_STATUS = {
  PICKED_UP: "PICKED_UP" as ShipmentStatus,
  IN_TRANSIT: "IN_TRANSIT" as ShipmentStatus,
  DELIVERED: "DELIVERED" as ShipmentStatus,
  FAILED: "FAILED" as ShipmentStatus,
};

export type QueueItem = {
  shipmentId: string;
  status: ShipmentStatus;
  note?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
};