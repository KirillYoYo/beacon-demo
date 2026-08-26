-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT,
    "population" INTEGER,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_forecasts" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION,
    "humidity" INTEGER,
    "pressure" INTEGER,
    "windSpeed" DOUBLE PRECISION,
    "windDir" INTEGER,
    "description" TEXT,
    "icon" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weather_forecasts_datetime_idx" ON "weather_forecasts"("datetime");

-- CreateIndex
CREATE UNIQUE INDEX "weather_forecasts_cityId_datetime_key" ON "weather_forecasts"("cityId", "datetime");

-- AddForeignKey
ALTER TABLE "weather_forecasts" ADD CONSTRAINT "weather_forecasts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
