import { TransferService } from "../services/transfer.service";
import { TransferStatus } from "../models/Transfer.model";

describe("TransferService - FSM Transitions", () => {
  describe("getAllowedTransitions", () => {
    it("should return [APPROVED] for PENDING status", () => {
      const allowed = TransferService.getAllowedTransitions(TransferStatus.PENDING);
      expect(allowed).toEqual([TransferStatus.APPROVED]);
    });

    it("should return [IN_TRANSIT, CANCELLED] for APPROVED status", () => {
      const allowed = TransferService.getAllowedTransitions(TransferStatus.APPROVED);
      expect(allowed).toEqual([TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED]);
    });

    it("should return [COMPLETED] for IN_TRANSIT status", () => {
      const allowed = TransferService.getAllowedTransitions(TransferStatus.IN_TRANSIT);
      expect(allowed).toEqual([TransferStatus.COMPLETED]);
    });

    it("should return [] for COMPLETED status", () => {
      const allowed = TransferService.getAllowedTransitions(TransferStatus.COMPLETED);
      expect(allowed).toEqual([]);
    });

    it("should return [] for CANCELLED status", () => {
      const allowed = TransferService.getAllowedTransitions(TransferStatus.CANCELLED);
      expect(allowed).toEqual([]);
    });
  });

  describe("transition validation", () => {
    const validTransitions: [TransferStatus, TransferStatus][] = [
      [TransferStatus.PENDING, TransferStatus.APPROVED],
      [TransferStatus.APPROVED, TransferStatus.IN_TRANSIT],
      [TransferStatus.APPROVED, TransferStatus.CANCELLED],
      [TransferStatus.IN_TRANSIT, TransferStatus.COMPLETED],
    ];

    const invalidTransitions: [TransferStatus, TransferStatus][] = [
      [TransferStatus.PENDING, TransferStatus.IN_TRANSIT],
      [TransferStatus.PENDING, TransferStatus.COMPLETED],
      [TransferStatus.PENDING, TransferStatus.CANCELLED],
      [TransferStatus.APPROVED, TransferStatus.PENDING],
      [TransferStatus.APPROVED, TransferStatus.COMPLETED],
      [TransferStatus.IN_TRANSIT, TransferStatus.PENDING],
      [TransferStatus.IN_TRANSIT, TransferStatus.APPROVED],
      [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
      [TransferStatus.COMPLETED, TransferStatus.PENDING],
      [TransferStatus.COMPLETED, TransferStatus.APPROVED],
      [TransferStatus.COMPLETED, TransferStatus.IN_TRANSIT],
      [TransferStatus.COMPLETED, TransferStatus.CANCELLED],
      [TransferStatus.CANCELLED, TransferStatus.PENDING],
      [TransferStatus.CANCELLED, TransferStatus.APPROVED],
      [TransferStatus.CANCELLED, TransferStatus.IN_TRANSIT],
      [TransferStatus.CANCELLED, TransferStatus.COMPLETED],
    ];

    test.each(validTransitions)(
      "should allow transition from %s to %s",
      (from, to) => {
        const allowed = TransferService.getAllowedTransitions(from);
        expect(allowed).toContain(to);
      }
    );

    test.each(invalidTransitions)(
      "should NOT allow transition from %s to %s",
      (from, to) => {
        const allowed = TransferService.getAllowedTransitions(from);
        expect(allowed).not.toContain(to);
      }
    );
  });
});
