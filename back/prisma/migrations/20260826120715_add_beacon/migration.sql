-- CreateTable
CREATE TABLE "BeaconRecord" (
    "id" SERIAL NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" INTEGER,
    "url" TEXT,
    "referrer" TEXT,
    "screenResolution" TEXT,
    "colorDepth" INTEGER,
    "language" TEXT,
    "platform" TEXT,
    "timezoneOffset" INTEGER,
    "deviceMemory" DOUBLE PRECISION,
    "hardwareConcurrency" INTEGER,
    "touchSupport" BOOLEAN,
    "firstPaint" DOUBLE PRECISION,
    "domReadyTime" DOUBLE PRECISION,
    "clicksCount" INTEGER,
    "connectionType" TEXT,
    "canvasFingerprint" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeaconRecord_pkey" PRIMARY KEY ("id")
);
