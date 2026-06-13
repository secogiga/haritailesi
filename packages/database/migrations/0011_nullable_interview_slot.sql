-- interview_requests.slot_id artık zorunlu değil (Calendly modu: aday kendi seçiyor)
ALTER TABLE "interview_requests" ALTER COLUMN "slot_id" DROP NOT NULL;
