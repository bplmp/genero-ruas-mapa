# Gênero do nome das ruas brasileiras - mapa interativo

## Dados

Os dados são extraídos do [OpenStreetMap](http://openstreetmap.org). Veja o arquivo `pipeline/pipeline.sh` para o processo.

Basicamente, tentamos extrair o gênero dos nomes de ruas da seguinte maneira:

1. Removendo palavras do nome como `da|do|das|dos|de`.
2. Removendo tipos do nome como `acesso|alameda|avenida|beco|caminho`.
3. Extraíndo títulos do nome como `ábade|agricultor|agrimensor|agente`, e atribuindo gênero baseado nesses, quando existem.
4. Atribuindo gênero para os restantes baseado nessa [base de dados de nomes por gênero do IBGE](https://github.com/MedidaSP/nomes-brasileiros-ibge).

Depois, extraímos um geojson, convertemos para mbtiles e fazemos upload para o [Mapbox](https://www.mapbox.com/).

## Credits

Based on [Road Orientations Map](https://mourner.github.io/road-orientation-map/), built by [Vladimir Agafonkin](https://twitter.com/mourner).
