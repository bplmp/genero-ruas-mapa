select r.*, m.freq as freq_mas, f.freq as freq_fem, t.gender as title_gender,
  case
       when t.gender is not null then t.gender
       when m.freq > f.freq then 'm'
       when m.freq < f.freq then 'f'
       when m.freq is not null and f.freq is null then 'm'
       when m.freq is null and f.freq is not null then 'f'
       when m.freq is null and f.freq is null and name is not null then 'n'
       else null
   end as gender
into osm_roads_clean_gender
from osm_roads_clean r
left join ibge_fem f
on upper(f.nome) = upper(unaccent(first_name))
left join ibge_mas m
on upper(m.nome) = upper(unaccent(first_name))
left join (select * from road_titles where gender in ('m','f')) t
on r.road_title = unaccent(t.title);
