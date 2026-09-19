export function getPublicSlotAvailability(slot: {
  status: string;
  capacity: number;
  reservedCount: number;
}) {
  const remaining = Math.max(0, slot.capacity - slot.reservedCount);

  return {
    available: slot.status === "AVAILABLE" && remaining > 0,
    remaining,
  };
}
