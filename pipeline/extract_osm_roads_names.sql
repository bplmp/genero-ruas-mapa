-- 7 mins to execute for all osm brazil roads
select
  split_part(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(unaccent(name)),
          '(\s|^)(da|do|das|dos|de)(\s|$)', ' ', 'gi'
        ),
        '^(acesso|alameda|avenida|beco|caminho|caminho particular|caminho de pedestre|complexo viario|espaco livre|esplanada|estrada|escadaria|estrada particular|estacionamento|galeria|jardim|ladeira|largo|passarela|praca|praca de retorno|passagem de pedestres|parque|passagem|passagem particular|passagem subterranea|patio|ponte|pontilhao|rua|rua particular|rua projetada|rodovia|servidao|tunel|travessa projetada|travessa|travessa particular|via de circulacao de pedestres|viaduto|viela|via elevada|viela particular|vereda|viela sanitaria|via|vila|vila particular|via de pedestre)(\s|$)', '', 'gi'
      ),
      (select '(^|\s)(' || unaccent(string_agg(title, '|')) || ')(\s|$)' from road_titles),
      '', 'gi'
    ),
' ', 1) as first_name,
substring(
  lower(unaccent(name)),
  '(?<=^)(acesso|alameda|avenida|beco|caminho|caminho particular|caminho de pedestre|complexo viario|espaco livre|esplanada|estrada|escadaria|estrada particular|estacionamento|galeria|jardim|ladeira|largo|passarela|praca|praca de retorno|passagem de pedestres|parque|passagem|passagem particular|passagem subterranea|patio|ponte|pontilhao|rua|rua particular|rua projetada|rodovia|servidao|tunel|travessa projetada|travessa|travessa particular|via de circulacao de pedestres|viaduto|viela|via elevada|viela particular|vereda|viela sanitaria|via|vila|vila particular|via de pedestre)(?=\s|$)'
) as road_type,
substring(
  lower(unaccent(name)),
  (select '(?<=^|\s)(' || unaccent(string_agg(title, '|')) || ')(?=\s|$)' from road_titles)
) as road_title,
name,
fclass,
geom
into osm_roads_clean
from osm_roads;
