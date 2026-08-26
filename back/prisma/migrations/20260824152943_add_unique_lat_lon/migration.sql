/*
  Warnings:

  - A unique constraint covering the columns `[lat,lon]` on the table `cities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cities_lat_lon_key" ON "cities"("lat", "lon");
