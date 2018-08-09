echo '--->sourcing env variables'
. .env

[ -f brazil-latest-free.shp.zip ] && echo "--->already have brazil osm data" || echo '--->downloading latest shapefile for brazil osm data' \
  && wget "https://download.geofabrik.de/south-america/brazil-latest-free.shp.zip" \
  && unzip brazil-latest-free.shp.zip \
  && echo '--->converting shapefile to sql statement' \
  && shp2pgsql -s 4326 gis_osm_roads_free_1.shp osm_roads postgres > osm_roads.sql \
  && echo '--->importing roads to postgres' \
  && psql -d $DB_NAME -U $DB_USER -p 5432 -c 'drop table if exists osm_roads;' \
  && psql -d $DB_NAME -U $DB_USER -p 5432 -f osm_roads.sql

echo '--->dropping tables'
psql -d $DB_NAME -U $DB_USER -p 5432 -f drop_tables.sql

echo '--->creating road titles table'
psql -d $DB_NAME -U $DB_USER -p 5432 -f create_road_titles.sql

echo '--->copying road titles'
psql -d $DB_NAME -U $DB_USER -p 5432 -f copy_road_titles.sql

echo '--->extracting osm roads names'
psql -d $DB_NAME -U $DB_USER -p 5432 -f extract_osm_roads_names.sql

echo '--->setting osm roads genders'
psql -d $DB_NAME -U $DB_USER -p 5432 -f set_osm_roads_gender.sql

echo '--->exporting geojson from postgis'
ogr2ogr -f GeoJSON osm_roads_clean_gender.geojson \
  "PG:host=localhost dbname=$DB_NAME user=$DB_USER password=$DB_PASS" \
  -sql "select geom, name, gender, fclass, road_type, road_title, first_name from osm_roads_clean_gender" \

echo '--->creating mbtiles'
tippecanoe -o osm_roads_clean_gender.mbtiles --simplification=10 --maximum-zoom=15 --drop-densest-as-needed osm_roads_clean_gender.geojson \

# # other options
# # create mbtiles
# tippecanoe -o osm_roads_clean_gender.mbtiles --maximum-zoom=15 --drop-densest-as-needed osm_roads_clean_gender.geojson
#
# # create mbtiles, no size or feature limit
# tippecanoe -o osm_roads_clean_gender_nolimit.mbtiles --maximum-zoom=15 --no-feature-limit --no-tile-size-limit osm_roads_clean_gender.geojson
#
# # create mbtiles, no size or feature limit, simplify
# tippecanoe -o osm_roads_clean_gender_nolimit_simp.mbtiles --maximum-zoom=15 --no-feature-limit --simplification=10 --no-tile-size-limit osm_roads_clean_gender.geojson
#
# # create mbtiles, try to improve dropping of features
# tippecanoe -o osm_roads_clean_gender_simp.mbtiles --maximum-zoom=15 --no-feature-limit --simplification=10 --drop-fraction-as-needed osm_roads_clean_gender.geojson

echo '--->uploading to mapbox'
mapbox --access-token $MAPBOX_TOKEN \
  upload $MAPBOX_USER_TABLE osm_roads_clean_gender.mbtiles

echo '--->deleting osm_roads_clean_gender.geojson'
rm osm_roads_clean_gender.geojson

echo '--->all done.'
