# [Gender names in Brazilian streets - interactive map](https://medidasp.com/projetos/genero-ruas/)

## Data

Street names and geometries are are extracted from [OpenStreetMap](http://openstreetmap.org). See `pipeline/pipeline.sh` for data processing steps.

In a nutshell, it extracts genders from street names following these steps:

1. Removing Portuguese stopwords from the street name.
2. Removing street types from the name (e.g. Street, Avenue, Alley).
3. Removing titles and professions from street names (e.g. Governor, Mayor, Pope).
4. Defining gender based [on this table extracted from the Brazilian Census](https://github.com/MedidaSP/nomes-brasileiros-ibge).

After that, I extract a geojson, convert it to mbtiles and upload it to [Mapbox](https://www.mapbox.com/).

## Credits

Based on [Road Orientations Map](https://mourner.github.io/road-orientation-map/), built by [Vladimir Agafonkin](https://twitter.com/mourner).

---

# [Gênero do nome das ruas brasileiras - mapa interativo](https://medidasp.com/projetos/genero-ruas/)

## Dados

Os dado de nomes e geometrias de ruas são extraídos do [OpenStreetMap](http://openstreetmap.org). Veja o arquivo `pipeline/pipeline.sh` para o processo.

Basicamente, tentamos extrair o gênero dos nomes de ruas da seguinte maneira:

1. Removendo palavras do nome como `da|do|das|dos|de`.
2. Removendo tipos do nome como `acesso|alameda|avenida|beco|caminho`.
3. Extraíndo títulos do nome como `ábade|agricultor|agrimensor|agente`, e atribuindo gênero baseado nesses, quando existem.
4. Atribuindo gênero para os restantes baseado nessa [base de dados de nomes por gênero do IBGE](https://github.com/MedidaSP/nomes-brasileiros-ibge).

Depois, extraímos um geojson, convertemos para mbtiles e fazemos upload para o [Mapbox](https://www.mapbox.com/).
