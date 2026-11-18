-- Coin catalog: design descriptions and every national-side series per country and denomination.
-- Generated from the ECB export (README.md per coin). Images are served from public/assets/coins.
-- Read-only reference data: any signed-in user may read it, only the service role may change it.

create table if not exists public.coin_issuers (
  country_code text primary key,
  description  text
);

create table if not exists public.coin_designs (
  country_code text not null,
  denomination text not null check (denomination in ('1c','2c','5c','10c','20c','50c','1e','2e')),
  description  text,
  details      jsonb not null default '[]'::jsonb,
  primary key (country_code, denomination)
);

create table if not exists public.coin_series (
  country_code text not null,
  denomination text not null,
  series_no    smallint not null check (series_no > 0),
  years        text not null,
  start_year   smallint not null,
  design       text not null,
  image_path   text not null,
  thumb_path   text not null,
  primary key (country_code, denomination, series_no),
  foreign key (country_code, denomination) references public.coin_designs (country_code, denomination) on delete cascade
);

alter table public.coin_issuers enable row level security;
alter table public.coin_designs enable row level security;
alter table public.coin_series  enable row level security;

drop policy if exists "coin_issuers readable by signed-in users" on public.coin_issuers;
create policy "coin_issuers readable by signed-in users" on public.coin_issuers
  for select to authenticated using (true);

drop policy if exists "coin_designs readable by signed-in users" on public.coin_designs;
create policy "coin_designs readable by signed-in users" on public.coin_designs
  for select to authenticated using (true);

drop policy if exists "coin_series readable by signed-in users" on public.coin_series;
create policy "coin_series readable by signed-in users" on public.coin_series
  for select to authenticated using (true);

insert into public.coin_issuers (country_code, description) values
  ('AD', 'Andorra signed a Monetary Agreement with the European Union on 30 June 2011. As a result, Andorra can use the euro as its official currency and issue its own euro coins. All the coins feature the 12 stars of the European flag.'),
  ('AT', 'Austria chose to produce a series of coins illustrating flowers, architecture and famous people from its history. The designs were chosen by a national panel and public opinion poll. Austrian artist Josef Kaiser created the designs.'),
  ('BE', 'Belgium''s euro coins were designed by Jan Alfons Keustermans, Director of the Municipal Academy of Fine Arts of Turnhout. There are three series of coins in circulation. All are valid.

The first series depicts King Albert II in the inner part of the coin, while the royal monogram - a capital "A" underneath a crown - among 12 stars, symbolising Europe, as well as the year of issuance appear in the outer part.

In 2008, Belgium slightly modified the design in order to comply with the European Commission''s guidelines. The coins of the second series also show King Albert II, but the royal monogram and the year of issuance now appear in the inner part of the coin, as do the mint marks and the country code for Belgium, "BE".

In 2014, Belgium introduced the third series of euro coins, which show King Philippe, his royal monogram "FP" and the country code for Belgium, "BE". The mint marks appear on either side of the year of issuance.'),
  ('BG', 'Bulgaria has chosen three designs for their national sides of the euro coins. All the coins also depict the 12 stars of the European flag.'),
  ('HR', 'Croatia has chosen four designs for their national sides of the euro coins, all featuring the distinctive Croatian chequerboard pattern in the background. All the coins also depict the 12 stars of the European flag.'),
  ('CY', '_No general text on the ECB page._'),
  ('EE', 'The design for the national side of Estonia’s coins is the same for all denominations. It features a geographical image of Estonia and the word "Eesti", which means "Estonia".'),
  ('FI', 'Finland chose three designs based upon motifs similar to those used before on national coins.'),
  ('FR', 'Each French coin denomination features a different design. There is one series of coins in circulation for the 1, 2 and 5 cent coins and two series for the €1, €2 and 10, 20, and 50 cent coins. All are valid as legal tender.'),
  ('DE', 'German officials and experts in numismatics chose three different designs for their euro coins.'),
  ('GR', 'The Minister for the National Economy and the Governor of the Bank of Greece chose the designs for their euro coins from a set of proposals presented by a national technical and artistic committee. The designer of the winning motifs was sculptor Georges Stamatopoulos, sponsored by the Bank of Greece. There is a separate design for each denomination.'),
  ('IE', 'The Government of Ireland decided on a single national design for all Irish coin denominations. They show the Celtic harp, a traditional symbol of Ireland, decorated with the year of issue and the inscription "Éire" − the Irish word for Ireland. The harp shown was designed by Jarlath Hayes.'),
  ('IT', 'In Italy, the euro coin designs were subject to scrutiny by a national technical and artistic committee before being presented to the nation on RAI UNO, Italy''s largest national television station. A different design has been selected for each denomination, chosen from masterpieces by Italy''s famous artists.'),
  ('LV', '_No general text on the ECB page._'),
  ('LT', 'Lithuania’s euro coins show the coat of arms of the Republic of Lithuania, Vytis, the country of issuance "LIETUVA" and the year of issuance "2015". The coins also feature the 12 stars of the European flag. They were designed by the sculptor Antanas Žukauskas.'),
  ('LU', 'Yvette Gastauer-Claire designed the coins by agreement with the Royal Household and the Luxembourg Government.

All the Luxembourg coins bear the profile of His Royal Highness Grand Duke Henri. They also bear the year of issue and the word "Luxembourg" written in Luxembourgish ("Lëtzebuerg").'),
  ('MT', '_No general text on the ECB page._'),
  ('MC', 'There are currently three series of euro coins from Monaco in circulation.

The first series, issued in 2002, features Prince Rainier III on the €2 coin. The €1 coin shows a double portrait of Prince Rainier III and his son Prince Albert. The 50, 20 and 10 cent coins depict the seal of the Prince of Monaco, while the coat of arms of the Grimaldi House is shown on the 5, 2 and 1 cent coins.

The second series, introduced in 2006, features a portrait of Prince Albert II on the €2 and €1 coins. His monogram appears on the 50, 20 and 10 cent coins. The coat of arms of the Grimaldi House remains the main design on the 5, 2 and 1 cent coins.

The third series, introduced in 2025, shows a frontal portrait of Prince Albert II on the €2 and €1 coins. His monogram is shown on the 50, 20 and 10 cent coins, while the coat of arms of the Grimaldi House is featured on the 5, 2 and 1 cent coins.'),
  ('NL', 'The Netherlands chose two designs by Bruno Ninaber van Eyben, showing Queen Beatrix, for the first series. There are two series of coins in circulation. Both are valid.

The second series, introduced in 2014, shows King Willem-Alexander and bears the inscription "Willem-Alexander Koning der Nederlanden" (King of the Netherlands).'),
  ('PT', 'Three different euro designs were chosen from entries to a national competition. Designer Vítor Manuel Fernandes dos Santos, who drew his inspiration from historical symbols and the seals of the first King of Portugal, Dom Afonso Henriques, won the competition with the following motifs:'),
  ('SM', '_No general text on the ECB page._'),
  ('SK', '_No general text on the ECB page._'),
  ('SI', '_No general text on the ECB page._'),
  ('ES', 'Spain’s coins feature three designs with effigies of the King, Miguel de Cervantes and the cathedral of Santiago de Compostela. There are three series of coins in circulation. All are valid.

For the second series, the coins were slightly redesigned in 2010 in order to comply with the common guidelines issued by the European Commission. The year, for instance, is inscribed on the inner part of the coin.'),
  ('VA', 'There are five series of Vatican City coins in circulation. All are valid. The first series, showing Pope John Paul II, was issued between 2002 and 2005.

The second series, issued between June 2005 and March 2006, shows the coat of arms of the Cardinal Chamberlain, the acting head of state of the Vatican City, superimposed on the emblem of the Apostolic Chamber in the centre of the coin. The upper part of this design is surrounded by the semicircular words "SEDE VACANTE" and the year of issue in Roman numerals, i.e. "MMV". The designer''s name, "D. LONGO", appears on the lower left-hand edge of the central design, while the respective engraver''s initials appear on the lower right-hand edge, namely "MAC inc" (on the 1 and 20 cent coins), "LDS inc" (on the 2 and 50 cent coins), "ELF inc" (on the 5 cent and €1 coins) and "MCC inc" (on the 10 cent and €2 coins). The third series, issued between April 2006 and December 2013, shows Pope Benedict XVI. To the left are the designer’s initials ("DL").

The fourth series, first issued in January 2014, shows Pope Francis.

The fifth series, first issued in March 2017, shows the coat of arms of the Sovereign of the Vatican City State, Pope Francis.

The coins in each series feature the 12 stars of the European flag, the words "CITTÀ DEL VATICANO", the year of issuance and the mintmark "R".')
on conflict (country_code) do update set description = excluded.description;

insert into public.coin_designs (country_code, denomination, description, details) values
  ('AD', '1c', 'The 1, 2 and 5 cent coins show a Pyrenean chamois and a golden eagle.', '[]'::jsonb),
  ('AD', '2c', 'The 1, 2 and 5 cent coins show a Pyrenean chamois and a golden eagle.', '[]'::jsonb),
  ('AD', '5c', 'The 1, 2 and 5 cent coins show a Pyrenean chamois and a golden eagle.', '[]'::jsonb),
  ('AD', '10c', 'The 10, 20 and 50 cent coins show the Romanesque church of Santa Coloma.', '[]'::jsonb),
  ('AD', '20c', 'The 10, 20 and 50 cent coins show the Romanesque church of Santa Coloma.', '[]'::jsonb),
  ('AD', '50c', 'The 10, 20 and 50 cent coins show the Romanesque church of Santa Coloma.', '[]'::jsonb),
  ('AD', '1e', 'The €1 coin features Casa de la Vall, the former seat of parliament and a building of cultural and historical interest.', '[]'::jsonb),
  ('AD', '2e', 'The €2 coin shows the coat of arms of Andorra with the motto "virtus unita fortior" (virtue united is stronger).', '[{"label": "Edge lettering", "value": "2 **, repeated six times."}]'::jsonb),
  ('AT', '1c', 'This coin features a gentian, as part of a floral series, symbolising a duty to the environment and the part Austria is playing in the development of a Community environmental policy.', '[]'::jsonb),
  ('AT', '2c', 'This coin features an edelweiss, as part of a floral series, symbolising a duty to the environment and the part Austria is playing in the development of a Community environmental policy.', '[]'::jsonb),
  ('AT', '5c', 'This coin features alpine primroses, as part of a floral series, symbolising a duty to the environment and the part Austria is playing in the development of a Community environmental policy.', '[]'::jsonb),
  ('AT', '10c', 'St. Stephen''s Cathedral, one of the jewels of Viennese Gothic architecture and a popular tourist venue, is depicted on this coin.', '[]'::jsonb),
  ('AT', '20c', 'This design features the Belvedere Palace, one of the most beautiful baroque palaces in Austria. It was here that the treaty re-establishing the sovereignty of Austria was signed in 1955, making its name synonymous with freedom.', '[]'::jsonb),
  ('AT', '50c', 'This coin shows the secession building in Vienna, illustrating the birth of art nouveau in Austria. The building symbolises the birth of a new age and represents a bridge to a new monetary era.', '[]'::jsonb),
  ('AT', '1e', 'Depicted on this coin is Wolfgang Amadeus Mozart, the famous Austrian composer, in reference to Austria as a land of music.', '[]'::jsonb),
  ('AT', '2e', 'This coin bears a portrait of the pacifist Bertha von Suttner, a symbol of Austria''s efforts over many decades to support peace.', '[{"label": "Edge lettering", "value": "2 EURO ***, repeated four times, alternately upright and inverted."}]'::jsonb),
  ('BE', '1c', null, '[]'::jsonb),
  ('BE', '2c', null, '[]'::jsonb),
  ('BE', '5c', null, '[]'::jsonb),
  ('BE', '10c', null, '[]'::jsonb),
  ('BE', '20c', null, '[]'::jsonb),
  ('BE', '50c', null, '[]'::jsonb),
  ('BE', '1e', null, '[]'::jsonb),
  ('BE', '2e', null, '[{"label": "Edge lettering", "value": "2 **, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('BG', '1c', 'The 1 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКА” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '2c', 'The 2 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКИ” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '5c', 'The 5 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКИ” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '10c', 'The 10 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКИ” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '20c', 'The 20 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКИ” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '50c', 'The 50 cent coin features a relief image of the Madara Horseman – an eighth-century rock carving and UNESCO World Heritage Site. The horseman faces right, spearing a lion – a powerful symbol from Bulgaria’s past.

The design also includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “СТОТИНКИ” (“CENT”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '1e', 'The €1 coin depicts Ivan of Rila, the patron saint of Bulgaria and founder of the Rila Monastery. He is shown holding a cross and a scroll.

The design includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “ЕВРО” (“EURO”) in Cyrillic script.', '[]'::jsonb),
  ('BG', '2e', 'The €2 coin features a portrait of Saint Paisius of Hilendar, a key figure of the Bulgarian national revival and author of Istoriya Slavyanobolgarskaya (Slavo-Bulgarian History). The design includes the year of issuance, the inscription “БЪЛГАРИЯ” (the country’s name in Bulgarian) and the word “ЕВРО” (“EURO”) in Cyrillic script.

The inscription “БОЖЕ ПАЗИ БЪЛГАРИЯ” (“GOD PROTECT BULGARIA”) is written twice, both normally and in reverse, around the edge of the coin.', '[]'::jsonb),
  ('HR', '1c', 'The 1-cent coin shows a motif of the letters “HR” in the angular Glagolitic script. The Glagolitic alphabet is the oldest known Slavic script and was used in Croatia until the 19th century. The coin was designed by Maja Škripelj and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '2c', 'The 2-cent coin shows a motif of the letters “HR” in the angular Glagolitic script. The Glagolitic alphabet is the oldest known Slavic script and was used in Croatia until the 19th century. The coin was designed by Maja Škripelj and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '5c', 'The 5-cent coin shows a motif of the letters “HR” in the angular Glagolitic script. The Glagolitic alphabet is the oldest known Slavic script and was used in Croatia until the 19th century. The coin was designed by Maja Škripelj and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '10c', 'The 10-cent coin features a portrait of inventor and engineer Nikola Tesla, who developed alternating current technology. The coin was designed by Ivan Domagoj Račić and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '20c', 'The 20-cent coin features a portrait of inventor and engineer Nikola Tesla, who developed alternating current technology. The coin was designed by Ivan Domagoj Račić and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '50c', 'The 50-cent coin features a portrait of inventor and engineer Nikola Tesla, who developed alternating current technology. The coin was designed by Ivan Domagoj Račić and includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '1e', 'The €1 coin shows a marten on a chequerboard background and was designed by Jagor Šunde, David Čemeljić and Fran Zekan. The marten is a small mammal that lent its name to the country’s former currency, the kuna. The design includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[]'::jsonb),
  ('HR', '2e', 'The €2 coin features a map of Croatia on a chequerboard background. The design, by Ivan Šivak, includes the year of issuance and the inscription “HRVATSKA”, the country’s name in Croatian.', '[{"label": "Edge lettering", "value": "“O LIJEPA O DRAGA O SLATKA SLOBODO” (“Oh beautiful, oh dear, oh sweet freedom”), a line from Ivan Gundulić’s famous play, Dubravka."}]'::jsonb),
  ('CY', '1c', 'The 1, 2 and 5-cent coins show the moufflon, a species of wild sheep found on Cyprus and representative of the island''s wildlife.', '[]'::jsonb),
  ('CY', '2c', 'The 1, 2 and 5-cent coins show the moufflon, a species of wild sheep found on Cyprus and representative of the island''s wildlife.', '[]'::jsonb),
  ('CY', '5c', 'The 1, 2 and 5-cent coins show the moufflon, a species of wild sheep found on Cyprus and representative of the island''s wildlife.', '[]'::jsonb),
  ('CY', '10c', 'Featured on the 10, 20 and 50-cent coins is the Kyrenia ship, a trading vessel which dates back to the fourth century BC and a symbol of Cyprus''s seafaring history and its importance as a centre of trade.', '[]'::jsonb),
  ('CY', '20c', 'Featured on the 10, 20 and 50-cent coins is the Kyrenia ship, a trading vessel which dates back to the fourth century BC and a symbol of Cyprus''s seafaring history and its importance as a centre of trade.', '[]'::jsonb),
  ('CY', '50c', 'Featured on the 10, 20 and 50-cent coins is the Kyrenia ship, a trading vessel which dates back to the fourth century BC and a symbol of Cyprus''s seafaring history and its importance as a centre of trade.', '[]'::jsonb),
  ('CY', '1e', 'The €1 and €2 coins depict a cruciform idol from the Chalcolithic period (3000 BC). This characteristic example of the island''s prehistoric art reflects Cyprus''s place at the heart of civilisation and antiquity.', '[]'::jsonb),
  ('CY', '2e', 'The €1 and €2 coins depict a cruciform idol from the Chalcolithic period (3000 BC). This characteristic example of the island''s prehistoric art reflects Cyprus''s place at the heart of civilisation and antiquity.', '[]'::jsonb),
  ('EE', '1c', null, '[]'::jsonb),
  ('EE', '2c', null, '[]'::jsonb),
  ('EE', '5c', null, '[]'::jsonb),
  ('EE', '10c', null, '[]'::jsonb),
  ('EE', '20c', null, '[]'::jsonb),
  ('EE', '50c', null, '[]'::jsonb),
  ('EE', '1e', null, '[]'::jsonb),
  ('EE', '2e', null, '[]'::jsonb),
  ('FI', '1c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '2c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '5c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '10c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '20c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '50c', '1, 2, 5, 10, 20 and 50-cent coins: these show the Finnish heraldic lion in a reproduction of a design by the sculptor Heikki Häiväoja. The heraldic lion in a variety of designs has been used on several Finnish coins over the years, for example on the 1 markka coins between 1964 and 2001.', '[]'::jsonb),
  ('FI', '1e', 'The artist Pertti Mäkinen created a motif depicting two flying swans for this coin. The design was taken from his competition entry for a coin to commemorate the 80th anniversary of the independence of Finland.', '[]'::jsonb),
  ('FI', '2e', 'The motif on this coin comprises cloudberries and cloudberry flowers in a design by Raimo Heino.', '[{"label": "Edge lettering", "value": "SUOMI FINLAND ***, where the * represents a lion''s head."}]'::jsonb),
  ('FR', '1c', '1, 2 and 5-cent coins: these depict a young, feminine Marianne with determined features that embody the desire for a sound and lasting Europe. The design was the work of Fabienne Courtiade, an engraver from the Paris Mint.', '[]'::jsonb),
  ('FR', '2c', '1, 2 and 5-cent coins: these depict a young, feminine Marianne with determined features that embody the desire for a sound and lasting Europe. The design was the work of Fabienne Courtiade, an engraver from the Paris Mint.', '[]'::jsonb),
  ('FR', '5c', '1, 2 and 5-cent coins: these depict a young, feminine Marianne with determined features that embody the desire for a sound and lasting Europe. The design was the work of Fabienne Courtiade, an engraver from the Paris Mint.', '[]'::jsonb),
  ('FR', '10c', 'The first series of the 10, 20 and 50 cent coins was designed by Laurent Jorlo. It depicts the sower, a figure commonly featured on the French franc. This modern and timeless image embodies a France which stays true to itself, while integrating into Europe.

In 2024 France introduced a new 10 cent coin designed by Joaquin Jimenez. The new coin depicts Simone Veil, a Holocaust survivor and the first President of the directly elected European Parliament. She spent much of her life fighting for women''s rights and pushed through the 1975 law decriminalising abortion in France.', '[]'::jsonb),
  ('FR', '20c', 'The first series of the 10, 20 and 50 cent coins was designed by Laurent Jorlo. It depicts the sower, a figure commonly featured on the French franc. This modern and timeless image embodies France, which stays true to itself, while integrating into Europe.

In 2024 France introduced a second series of 20 cent coins. Designed by Joaquin Jimenez, the coin features a portrait of Josephine Baker, a singer, dancer and civil rights activist. She was awarded the Resistance Medal, the Croix de Guerre and the Legion of Honour for her efforts during World War II.

The portrait is set within a French flag motif, symbolising Baker''s iconic place in the French Republic, represented by the letters RF.', '[]'::jsonb),
  ('FR', '50c', 'The first series of the 10, 20 and 50 cent coins was designed by Laurent Jorlo. It depicts the sower, a figure commonly featured on the French franc. This modern and timeless image embodies a France which stays true to itself, while integrating into Europe.

In 2024 France introduced a new 50 cent coin series. Designed by Joaquin Jimenez, the coin features a portrait of Nobel Prize-winning scientist Marie Curie, known for her pioneering work on radioactivity.

The portrait is set within a French flag motif, symbolising Curie''s iconic place in the French Republic, represented by the letters RF.', '[]'::jsonb),
  ('FR', '1e', 'The design chosen for the first series of €1 and €2 coins was the work of the artist Joaquin Jimenez. It features a tree symbolising life, continuity and growth, standing within a hexagon and encircled by the motto of the French Republic, "Liberté, Egalité, Fraternité" (Liberty, equality, fraternity).

In 2022 France introduced a second series of €1 and €2 coins. The new design features oak and olive branches that form the tree of life and symbolise strength, solidity and peace. The tree and the motto stand within a hexagon.', '[]'::jsonb),
  ('FR', '2e', 'The design chosen for the first series of €1 and €2 coins was the work of the artist Joaquin Jimenez. It features a tree symbolising life, continuity and growth, standing within a hexagon and encircled by the motto of the French Republic, "Liberté, Egalité, Fraternité" (Liberty, equality, fraternity).

In 2022 France introduced a second series of €1 and €2 coins. The new design features oak and olive branches that form the tree of life and symbolise strength, solidity and peace. The tree and the motto stand within a hexagon.', '[{"label": "Edge lettering", "value": "2**, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('DE', '1c', '1, 2 and 5-cent coins: the oak twig, reminiscent of that found on the former German pfennig coins, provides the motif for these coins. It was designed by Professor Rolf Lederbogen.', '[]'::jsonb),
  ('DE', '2c', '1, 2 and 5-cent coins: the oak twig, reminiscent of that found on the former German pfennig coins, provides the motif for these coins. It was designed by Professor Rolf Lederbogen.', '[]'::jsonb),
  ('DE', '5c', '1, 2 and 5-cent coins: the oak twig, reminiscent of that found on the former German pfennig coins, provides the motif for these coins. It was designed by Professor Rolf Lederbogen.', '[]'::jsonb),
  ('DE', '10c', '10, 20 and 50-cent coins: the Brandenburg Gate, a symbol of the division of Germany and its subsequent reunification, is the motif used on these coins. The perspective of the design, by Reinhard Heinsdorff, emphasises the opening of the gate, stressing the unification of Germany and Europe.', '[]'::jsonb),
  ('DE', '20c', '10, 20 and 50-cent coins: the Brandenburg Gate, a symbol of the division of Germany and its subsequent reunification, is the motif used on these coins. The perspective of the design, by Reinhard Heinsdorff, emphasises the opening of the gate, stressing the unification of Germany and Europe.', '[]'::jsonb),
  ('DE', '50c', '10, 20 and 50-cent coins: the Brandenburg Gate, a symbol of the division of Germany and its subsequent reunification, is the motif used on these coins. The perspective of the design, by Reinhard Heinsdorff, emphasises the opening of the gate, stressing the unification of Germany and Europe.', '[]'::jsonb),
  ('DE', '1e', '€1 and €2 coins: the traditional symbol of German sovereignty, the eagle, surrounded by the stars of Europe, appears on these coins. This motif was designed by Heinz and Sneschana Russewa-Hoyer.', '[]'::jsonb),
  ('DE', '2e', '€1 and €2 coins: the traditional symbol of German sovereignty, the eagle, surrounded by the stars of Europe, appears on these coins. This motif was designed by Heinz and Sneschana Russewa-Hoyer.', '[{"label": "Edge lettering", "value": "EINIGKEIT UND RECHT UND FREIHEIT (unity, justice and freedom) and the emblem of the Federal Eagle."}]'::jsonb),
  ('GR', '1c', 'This design features an advanced model of an Athenian trireme, the largest warship afloat for more than 200 years, dating from the time of the Athenian democracy (fifth century BC).', '[]'::jsonb),
  ('GR', '2c', 'Depicted on this coin is a corvette, a type of ship used during the Greek War of Independence (1821-27).', '[]'::jsonb),
  ('GR', '5c', 'This coin shows a modern sea-going tanker, reflecting the innovative spirit of Greek shipping.', '[]'::jsonb),
  ('GR', '10c', 'Rigas Fereos (Velestinlis) (1757-98) is featured on this coin. He was a forerunner and leading figure of the Greek enlightenment, as well as a visionary and herald of Balkan liberation from Ottoman rule.', '[]'::jsonb),
  ('GR', '20c', 'This coin commemorates Ioannis Capodistrias (1776-1831), a leading national and European politician and diplomat who became the first Governor of Greece (1830-31) following the Greek War of Independence (1821-27).', '[]'::jsonb),
  ('GR', '50c', 'Eleftherios Venizelos (1864-1936), one of Greece''s most prominent political figures, is shown on this coin. He was a pioneer in social reform, a renowned diplomat and played a key role in modernising the Greek state and liberating Northern Greece and the Aegean islands.', '[]'::jsonb),
  ('GR', '1e', 'The image of the owl featured in this design was copied from an ancient Athenian 4-drachma coin (fifth century BC).', '[]'::jsonb),
  ('GR', '2e', 'This coin depicts a scene from a mosaic in Sparta (third century AD), showing Europa being abducted by Zeus, who has taken the form of a bull. Europa is a figure from Greek mythology after whom Europe was named.', '[{"label": "Edge lettering", "value": "EΛΛHNIKH ΔHMOKPATIA * (Hellenic Republic)."}]'::jsonb),
  ('IE', '1c', null, '[]'::jsonb),
  ('IE', '2c', null, '[]'::jsonb),
  ('IE', '5c', null, '[]'::jsonb),
  ('IE', '10c', null, '[]'::jsonb),
  ('IE', '20c', null, '[]'::jsonb),
  ('IE', '50c', null, '[]'::jsonb),
  ('IE', '1e', null, '[]'::jsonb),
  ('IE', '2e', null, '[{"label": "Edge lettering", "value": "2**, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('IT', '1c', 'The Castel del Monte appears on this coin.', '[]'::jsonb),
  ('IT', '2c', 'This coin shows the Mole Antonelliana, a tower designed in 1863 by Alessandro Antonelli.', '[]'::jsonb),
  ('IT', '5c', 'This design features the Flavius amphitheatre, which Emperor Vespasian began building around 75 AD and Emperor Titus inaugurated in 80 AD.', '[]'::jsonb),
  ('IT', '10c', 'This coin commemorates one of the greatest triumphs in Italian art. It shows one of the most famous works in the world, the "Birth of Venus" by Sandro Botticelli.', '[]'::jsonb),
  ('IT', '20c', 'Portrayed on this coin is a sculpture by Umberto Boccioni, leader of the Italian futurist school.', '[]'::jsonb),
  ('IT', '50c', 'The statue of Emperor Marcus Aurelius on horseback is the main feature on this coin.', '[]'::jsonb),
  ('IT', '1e', 'This coin shows the famous drawing by Leonardo da Vinci, displayed in the gallery of the Academy in Venice, illustrating the ideal proportions of the human body.', '[]'::jsonb),
  ('IT', '2e', 'Depicted on this coin is a portrait drawn by Raphaël of Dante Alighieri, housed in the Pope Julius II Wing of the Vatican City Palace.', '[{"label": "Edge lettering", "value": "2*, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('LV', '1c', 'The 1 cent coin shows the small coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '2c', 'The 2 cent coin shows the small coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '5c', 'The 5 cent coin shows the small coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '10c', 'The 10 cent coin shows the large coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '20c', 'The 20 cent coin shows the large coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '50c', 'The 50 cent coin shows the large coat of arms of the Republic of Latvia. The designer is Laimonis Šēnbergs.', '[]'::jsonb),
  ('LV', '1e', 'The €1 coin features a Latvian folk maiden. This image was originally used on the silver 5 lats coin in 1929. The designer is Guntars Sietiņš.', '[]'::jsonb),
  ('LV', '2e', 'The €2 coin features a Latvian folk maiden. This image was originally used on the silver 5 lats coin in 1929. The edge of the coin bears the inscription DIEVS * SVĒTĪ * LATVIJU (GOD BLESS LATVIA). The designer is Guntars Sietiņš.', '[]'::jsonb),
  ('LT', '1c', null, '[]'::jsonb),
  ('LT', '2c', null, '[]'::jsonb),
  ('LT', '5c', null, '[]'::jsonb),
  ('LT', '10c', null, '[]'::jsonb),
  ('LT', '20c', null, '[]'::jsonb),
  ('LT', '50c', null, '[]'::jsonb),
  ('LT', '1e', null, '[]'::jsonb),
  ('LT', '2e', null, '[{"label": "Edge lettering", "value": "LAISVĖ * VIENYBĖ * GEROVĖ * (Freedom * Unity * Well-Being *)"}]'::jsonb),
  ('LU', '1c', null, '[]'::jsonb),
  ('LU', '2c', null, '[]'::jsonb),
  ('LU', '5c', null, '[]'::jsonb),
  ('LU', '10c', null, '[]'::jsonb),
  ('LU', '20c', null, '[]'::jsonb),
  ('LU', '50c', null, '[]'::jsonb),
  ('LU', '1e', null, '[]'::jsonb),
  ('LU', '2e', null, '[]'::jsonb),
  ('MT', '1c', 'The 1, 2 and 5-cent coins depict the altar at the prehistoric temple complex of Mnajdra, built around 3600 BC on a low elevation overlooking the sea.', '[]'::jsonb),
  ('MT', '2c', 'The 1, 2 and 5-cent coins depict the altar at the prehistoric temple complex of Mnajdra, built around 3600 BC on a low elevation overlooking the sea.', '[]'::jsonb),
  ('MT', '5c', 'The 1, 2 and 5-cent coins depict the altar at the prehistoric temple complex of Mnajdra, built around 3600 BC on a low elevation overlooking the sea.', '[]'::jsonb),
  ('MT', '10c', 'The 10, 20 and 50-cent coins bear the Emblem of Malta, a shield displaying a heraldic representation of the Maltese national flag and supporting a mural crown that represents the fortifications of Malta and denotes a city state. The shield is bounded on the left by an olive branch and on the right by a palm branch, symbols of peace traditionally associated with Malta, forming a wreath tied at its base by a ribbon which carries the inscription "Repubblika ta'' Malta" (Republic of Malta).', '[]'::jsonb),
  ('MT', '20c', 'The 10, 20 and 50-cent coins bear the Emblem of Malta, a shield displaying a heraldic representation of the Maltese national flag and supporting a mural crown that represents the fortifications of Malta and denotes a city state. The shield is bounded on the left by an olive branch and on the right by a palm branch, symbols of peace traditionally associated with Malta, forming a wreath tied at its base by a ribbon which carries the inscription "Repubblika ta'' Malta" (Republic of Malta).', '[]'::jsonb),
  ('MT', '50c', 'The 10, 20 and 50-cent coins bear the Emblem of Malta, a shield displaying a heraldic representation of the Maltese national flag and supporting a mural crown that represents the fortifications of Malta and denotes a city state. The shield is bounded on the left by an olive branch and on the right by a palm branch, symbols of peace traditionally associated with Malta, forming a wreath tied at its base by a ribbon which carries the inscription "Repubblika ta'' Malta" (Republic of Malta).', '[]'::jsonb),
  ('MT', '1e', 'The €1 and €2 coins show the emblem used by the Sovereign Order of Malta. During the Order''s rule over Malta, between 1530 and 1798, the eight-pointed cross became associated with the island and is now often referred to as the Maltese Cross.', '[]'::jsonb),
  ('MT', '2e', 'The €1 and €2 coins show the emblem used by the Sovereign Order of Malta. During the Order''s rule over Malta, between 1530 and 1798, the eight-pointed cross became associated with the island and is now often referred to as the Maltese Cross.', '[]'::jsonb),
  ('MC', '1c', null, '[]'::jsonb),
  ('MC', '2c', null, '[]'::jsonb),
  ('MC', '5c', null, '[]'::jsonb),
  ('MC', '10c', null, '[]'::jsonb),
  ('MC', '20c', null, '[]'::jsonb),
  ('MC', '50c', null, '[]'::jsonb),
  ('MC', '1e', null, '[]'::jsonb),
  ('MC', '2e', null, '[{"label": "Edge lettering", "value": "2**, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('NL', '1c', '1, 2, 5, 10, 20 and 50-cent coins:First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '2c', '1, 2, 5, 10, 20 and 50-cent coins:

First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '5c', '1, 2, 5, 10, 20 and 50-cent coins:

First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '10c', '1, 2, 5, 10, 20 and 50-cent coins:

First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '20c', '1, 2, 5, 10, 20 and 50-cent coins:

First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '50c', '1, 2, 5, 10, 20 and 50-cent coins:

First series: Queen Beatrix is shown encircled by the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: Superimposed on an effigy of the King Willem-Alexander are the words "Willem-Alexander Koning der Nederlanden; (King of the Netherlands). The mint marks appear on either side of the name.', '[]'::jsonb),
  ('NL', '1e', 'The €1 and €2 coins:

First series: Queen Beatrix is shown with the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: King Willem-Alexander is shown with the inscription "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the year of issuance.', '[]'::jsonb),
  ('NL', '2e', '€1 and €2 coins:

First series: Queen Beatrix is shown with the inscription "Beatrix Koningin der Nederlanden" (Queen of the Netherlands).

Second series: King Willem-Alexander is shown with the inscription "Willem-Alexander Koning der Nederlanden" (King of the Netherlands). The mint marks appear on either side of the year of issuance.', '[{"label": "Edge lettering", "value": "GOD * ZIJ * MET * ONS * (God be with us)."}]'::jsonb),
  ('PT', '1c', '1, 2 and 5-cent coins: these bear the image of the first royal seal, from 1134, along with the inscription "Portugal".', '[]'::jsonb),
  ('PT', '2c', '1, 2 and 5-cent coins: these bear the image of the first royal seal, from 1134, along with the inscription "Portugal".', '[]'::jsonb),
  ('PT', '5c', '1, 2 and 5-cent coins: these bear the image of the first royal seal, from 1134, along with the inscription "Portugal".', '[]'::jsonb),
  ('PT', '10c', '10, 20 and 50-cent coins: these depict the royal seal of 1142 as the centrepiece of the design.', '[]'::jsonb),
  ('PT', '20c', '10, 20 and 50-cent coins: these depict the royal seal of 1142 as the centrepiece of the design.', '[]'::jsonb),
  ('PT', '50c', '10, 20 and 50-cent coins: these depict the royal seal of 1142 as the centrepiece of the design.', '[]'::jsonb),
  ('PT', '1e', '€1 and €2 coins: the country''s castles and coats of arms are set amid the European stars. This symbolises dialogue, the exchange of values and the dynamics of the building of Europe. The centrepiece is the royal seal of 1144.', '[]'::jsonb),
  ('PT', '2e', '€1 and €2 coins: the country''s castles and coats of arms are set amid the European stars. This symbolises dialogue, the exchange of values and the dynamics of the building of Europe. The centrepiece is the royal seal of 1144.', '[{"label": "Edge lettering", "value": "five coats of arms and seven castles, all equally spaced."}]'::jsonb),
  ('SM', '1c', 'First series: The 1, 2 and 5-cent coins show the Third Tower (Montale), the Statue of Liberty and the First Tower (Guaita) respectively.

Second series: The 1, 2 and 5-cent coins show the official coat of arms of the Republic of San Marino, the City Gate and the Church of St Quirinus, respectively.', '[]'::jsonb),
  ('SM', '2c', 'First series: The 1, 2 and 5-cent coins show the Third Tower (Montale), the Statue of Liberty and the First Tower (Guaita) respectively.

Second series: The 1, 2 and 5-cent coins show the official coat of arms of the Republic of San Marino, the City Gate and the Church of St Quirinus, respectively.', '[]'::jsonb),
  ('SM', '5c', 'First series: The 1, 2 and 5-cent coins show the Third Tower (Montale), the Statue of Liberty and the First Tower (Guaita) respectively.

Second series: The 1, 2 and 5-cent coins show the official coat of arms of the Republic of San Marino, the City Gate and the Church of St Quirinus, respectively.', '[]'::jsonb),
  ('SM', '10c', 'First series: The 10-cent coin features the Basilica of Saint Marinus.

Second series: The 10-cent coin features the Church of St Francis.', '[]'::jsonb),
  ('SM', '20c', 'First series: Saint Marinus, based on a canvas of the Guercino school, is depicted on this coin.

Second series: Mount Titano with the three Towers is depicted on this coin.', '[]'::jsonb),
  ('SM', '50c', 'First series: The 50-cent coin shows the Three Towers of San Marino: Guaita, Cesta and Montale.

Second series: The 50-cent coin shows the portrait of Saint Marino, detail of a painting by Emilio Retrosi.', '[]'::jsonb),
  ('SM', '1e', 'First series: The Republic''s official coat of arms features on the €1 coin.

Second series: The Second Tower features on the €1 coin.', '[]'::jsonb),
  ('SM', '2e', 'First series: The Government building (Palazzo Pubblico) is shown on this coin.

Second series: The portrait of Saint Marino, detail of a painting by Giovan Battista Urbinelli, is shown on this coin.', '[{"label": "Edge lettering", "value": "2*, repeated six times, alternately upright and inverted."}]'::jsonb),
  ('SK', '1c', 'The 1, 2 and 5 cent coins feature the Tatra Mountains’ peak, Kriváň, a symbol of the sovereignty of the Slovak nation, and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '2c', 'The 1, 2 and 5 cent coins feature the Tatra Mountains’ peak, Kriváň, a symbol of the sovereignty of the Slovak nation, and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '5c', 'The 1, 2 and 5 cent coins feature the Tatra Mountains’ peak, Kriváň, a symbol of the sovereignty of the Slovak nation, and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '10c', 'The 10, 20 and 50 cent coins show Bratislava castle and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '20c', 'The 10, 20 and 50 cent coins show Bratislava castle and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '50c', 'The 10, 20 and 50 cent coins show Bratislava castle and the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '1e', 'The €1 and €2 coins depict a double cross on three hills, as featured in the national emblem of Slovakia.', '[]'::jsonb),
  ('SK', '2e', 'The €1 and €2 coins depict a double cross on three hills, as featured in the national emblem of Slovakia.', '[]'::jsonb),
  ('SI', '1c', 'This coin bears the image of a stork.', '[]'::jsonb),
  ('SI', '2c', 'The Sovereign Enthronement Stone features on this coin.', '[]'::jsonb),
  ('SI', '5c', 'This coin depicts a sower.', '[]'::jsonb),
  ('SI', '10c', 'This coin features architect Jože Plečnik’s unrealised plan for the Slovenian Parliament.', '[]'::jsonb),
  ('SI', '20c', 'Lipizzaner horses form the central feature of this design.', '[]'::jsonb),
  ('SI', '50c', 'The Triglav mountain is depicted on this coin.', '[]'::jsonb),
  ('SI', '1e', 'This coin bears a portrait of Primož Trubar, author of the first book printed in Slovene.', '[]'::jsonb),
  ('SI', '2e', 'This coin shows the poet France Prešeren and the inscription "Shivé naj vsi naródi" (God’s blessing on all nations) − a line taken from his poem "Zdravljica" which is also used in the country’s national anthem.', '[{"label": "Edge lettering", "value": "SLOVENIJA followed by an engraved dot."}]'::jsonb),
  ('ES', '1c', '1, 2 and 5-cent coins: the cathedral of Santiago de Compostela, a jewel of Spanish Romanesque architecture and one of the most famous pilgrimage destinations in the world, is pictured on these coins. They show the monumental facade of the Obradoiro, a splendid example of Spanish baroque construction, started in 1667 by Jose del Toro and Domingo de Andrade. It was finished in the 18th century by Fernando Casas y Novoa.', '[]'::jsonb),
  ('ES', '2c', '1, 2 and 5-cent coins: the cathedral of Santiago de Compostela, a jewel of Spanish Romanesque architecture and one of the most famous pilgrimage destinations in the world, is pictured on these coins. They show the monumental facade of the Obradoiro, a splendid example of Spanish baroque construction, started in 1667 by Jose del Toro and Domingo de Andrade. It was finished in the 18th century by Fernando Casas y Novoa.', '[]'::jsonb),
  ('ES', '5c', '1, 2 and 5-cent coins: the cathedral of Santiago de Compostela, a jewel of Spanish Romanesque architecture and one of the most famous pilgrimage destinations in the world, is pictured on these coins. They show the monumental facade of the Obradoiro, a splendid example of Spanish baroque construction, started in 1667 by Jose del Toro and Domingo de Andrade. It was finished in the 18th century by Fernando Casas y Novoa.', '[]'::jsonb),
  ('ES', '10c', '10, 20 and 50-cent coins: Miguel de Cervantes, the father of Spanish literature, is shown on these coins, reflecting "the universality of the man and his work".', '[]'::jsonb),
  ('ES', '20c', '10, 20 and 50-cent coins: Miguel de Cervantes, the father of Spanish literature, is shown on these coins, reflecting "the universality of the man and his work".', '[]'::jsonb),
  ('ES', '50c', '10, 20 and 50-cent coins: Miguel de Cervantes, the father of Spanish literature, is shown on these coins, reflecting "the universality of the man and his work".', '[]'::jsonb),
  ('ES', '1e', 'The first and second series show a portrait of King Juan Carlos I de Borbón y Borbón.

In 2015, Spain introduced a third series of €1 and €2 coins showing the new King Felipe VI and the country code ‘ESPAÑA 2015’. The mint mark appears at the right of the effigy.', '[]'::jsonb),
  ('ES', '2e', 'The first and second series show a portrait of King Juan Carlos I de Borbón y Borbón.

In 2015, Spain introduced a third series of €1 and €2 coins showing the new King Felipe VI and the country code ‘ESPAÑA 2015’. The mint mark appears at the right of the effigy.', '[]'::jsonb),
  ('VA', '1c', null, '[]'::jsonb),
  ('VA', '2c', null, '[]'::jsonb),
  ('VA', '5c', null, '[]'::jsonb),
  ('VA', '10c', null, '[]'::jsonb),
  ('VA', '20c', null, '[]'::jsonb),
  ('VA', '50c', null, '[]'::jsonb),
  ('VA', '1e', null, '[]'::jsonb),
  ('VA', '2e', null, '[{"label": "Edge lettering", "value": "2*, repeated six times, alternately upright and inverted."}]'::jsonb)
on conflict (country_code, denomination) do update set description = excluded.description, details = excluded.details;

insert into public.coin_series (country_code, denomination, series_no, years, start_year, design, image_path, thumb_path) values
  ('AD', '1c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/1c/s1.webp', 'assets/coins/ad/1c/s1-thumb.webp'),
  ('AD', '2c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/2c/s1.webp', 'assets/coins/ad/2c/s1-thumb.webp'),
  ('AD', '5c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/5c/s1.webp', 'assets/coins/ad/5c/s1-thumb.webp'),
  ('AD', '10c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/10c/s1.webp', 'assets/coins/ad/10c/s1-thumb.webp'),
  ('AD', '20c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/20c/s1.webp', 'assets/coins/ad/20c/s1-thumb.webp'),
  ('AD', '50c', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/50c/s1.webp', 'assets/coins/ad/50c/s1-thumb.webp'),
  ('AD', '1e', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/1e/s1.webp', 'assets/coins/ad/1e/s1-thumb.webp'),
  ('AD', '2e', 1, '2014–present', 2014, 'Single series', 'assets/coins/ad/2e/s1.webp', 'assets/coins/ad/2e/s1-thumb.webp'),
  ('AT', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/1c/s1.webp', 'assets/coins/at/1c/s1-thumb.webp'),
  ('AT', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/2c/s1.webp', 'assets/coins/at/2c/s1-thumb.webp'),
  ('AT', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/5c/s1.webp', 'assets/coins/at/5c/s1-thumb.webp'),
  ('AT', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/10c/s1.webp', 'assets/coins/at/10c/s1-thumb.webp'),
  ('AT', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/20c/s1.webp', 'assets/coins/at/20c/s1-thumb.webp'),
  ('AT', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/50c/s1.webp', 'assets/coins/at/50c/s1-thumb.webp'),
  ('AT', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/1e/s1.webp', 'assets/coins/at/1e/s1-thumb.webp'),
  ('AT', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/at/2e/s1.webp', 'assets/coins/at/2e/s1-thumb.webp'),
  ('BE', '1c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/1c/s1.webp', 'assets/coins/be/1c/s1-thumb.webp'),
  ('BE', '1c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/1c/s2.webp', 'assets/coins/be/1c/s2-thumb.webp'),
  ('BE', '1c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/1c/s3.webp', 'assets/coins/be/1c/s3-thumb.webp'),
  ('BE', '2c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/2c/s1.webp', 'assets/coins/be/2c/s1-thumb.webp'),
  ('BE', '2c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/2c/s2.webp', 'assets/coins/be/2c/s2-thumb.webp'),
  ('BE', '2c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/2c/s3.webp', 'assets/coins/be/2c/s3-thumb.webp'),
  ('BE', '5c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/5c/s1.webp', 'assets/coins/be/5c/s1-thumb.webp'),
  ('BE', '5c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/5c/s2.webp', 'assets/coins/be/5c/s2-thumb.webp'),
  ('BE', '5c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/5c/s3.webp', 'assets/coins/be/5c/s3-thumb.webp'),
  ('BE', '10c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/10c/s1.webp', 'assets/coins/be/10c/s1-thumb.webp'),
  ('BE', '10c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/10c/s2.webp', 'assets/coins/be/10c/s2-thumb.webp'),
  ('BE', '10c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/10c/s3.webp', 'assets/coins/be/10c/s3-thumb.webp'),
  ('BE', '20c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/20c/s1.webp', 'assets/coins/be/20c/s1-thumb.webp'),
  ('BE', '20c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/20c/s2.webp', 'assets/coins/be/20c/s2-thumb.webp'),
  ('BE', '20c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/20c/s3.webp', 'assets/coins/be/20c/s3-thumb.webp'),
  ('BE', '50c', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/50c/s1.webp', 'assets/coins/be/50c/s1-thumb.webp'),
  ('BE', '50c', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/50c/s2.webp', 'assets/coins/be/50c/s2-thumb.webp'),
  ('BE', '50c', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/50c/s3.webp', 'assets/coins/be/50c/s3-thumb.webp'),
  ('BE', '1e', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/1e/s1.webp', 'assets/coins/be/1e/s1-thumb.webp'),
  ('BE', '1e', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/1e/s2.webp', 'assets/coins/be/1e/s2-thumb.webp'),
  ('BE', '1e', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/1e/s3.webp', 'assets/coins/be/1e/s3-thumb.webp'),
  ('BE', '2e', 1, '1999–2007', 1999, 'King Albert II (first design)', 'assets/coins/be/2e/s1.webp', 'assets/coins/be/2e/s1-thumb.webp'),
  ('BE', '2e', 2, '2008–2013', 2008, 'King Albert II (redesign to EU guidelines)', 'assets/coins/be/2e/s2.webp', 'assets/coins/be/2e/s2-thumb.webp'),
  ('BE', '2e', 3, '2014–present', 2014, 'King Philippe', 'assets/coins/be/2e/s3.webp', 'assets/coins/be/2e/s3-thumb.webp'),
  ('BG', '1c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/1c/s1.webp', 'assets/coins/bg/1c/s1-thumb.webp'),
  ('BG', '2c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/2c/s1.webp', 'assets/coins/bg/2c/s1-thumb.webp'),
  ('BG', '5c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/5c/s1.webp', 'assets/coins/bg/5c/s1-thumb.webp'),
  ('BG', '10c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/10c/s1.webp', 'assets/coins/bg/10c/s1-thumb.webp'),
  ('BG', '20c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/20c/s1.webp', 'assets/coins/bg/20c/s1-thumb.webp'),
  ('BG', '50c', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/50c/s1.webp', 'assets/coins/bg/50c/s1-thumb.webp'),
  ('BG', '1e', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/1e/s1.webp', 'assets/coins/bg/1e/s1-thumb.webp'),
  ('BG', '2e', 1, '2026–present', 2026, 'Single series', 'assets/coins/bg/2e/s1.webp', 'assets/coins/bg/2e/s1-thumb.webp'),
  ('HR', '1c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/1c/s1.webp', 'assets/coins/hr/1c/s1-thumb.webp'),
  ('HR', '2c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/2c/s1.webp', 'assets/coins/hr/2c/s1-thumb.webp'),
  ('HR', '5c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/5c/s1.webp', 'assets/coins/hr/5c/s1-thumb.webp'),
  ('HR', '10c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/10c/s1.webp', 'assets/coins/hr/10c/s1-thumb.webp'),
  ('HR', '20c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/20c/s1.webp', 'assets/coins/hr/20c/s1-thumb.webp'),
  ('HR', '50c', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/50c/s1.webp', 'assets/coins/hr/50c/s1-thumb.webp'),
  ('HR', '1e', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/1e/s1.webp', 'assets/coins/hr/1e/s1-thumb.webp'),
  ('HR', '2e', 1, '2023–present', 2023, 'Single series', 'assets/coins/hr/2e/s1.webp', 'assets/coins/hr/2e/s1-thumb.webp'),
  ('CY', '1c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/1c/s1.webp', 'assets/coins/cy/1c/s1-thumb.webp'),
  ('CY', '2c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/2c/s1.webp', 'assets/coins/cy/2c/s1-thumb.webp'),
  ('CY', '5c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/5c/s1.webp', 'assets/coins/cy/5c/s1-thumb.webp'),
  ('CY', '10c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/10c/s1.webp', 'assets/coins/cy/10c/s1-thumb.webp'),
  ('CY', '20c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/20c/s1.webp', 'assets/coins/cy/20c/s1-thumb.webp'),
  ('CY', '50c', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/50c/s1.webp', 'assets/coins/cy/50c/s1-thumb.webp'),
  ('CY', '1e', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/1e/s1.webp', 'assets/coins/cy/1e/s1-thumb.webp'),
  ('CY', '2e', 1, '2008–present', 2008, 'Single series', 'assets/coins/cy/2e/s1.webp', 'assets/coins/cy/2e/s1-thumb.webp'),
  ('EE', '1c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/1c/s1.webp', 'assets/coins/ee/1c/s1-thumb.webp'),
  ('EE', '2c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/2c/s1.webp', 'assets/coins/ee/2c/s1-thumb.webp'),
  ('EE', '5c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/5c/s1.webp', 'assets/coins/ee/5c/s1-thumb.webp'),
  ('EE', '10c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/10c/s1.webp', 'assets/coins/ee/10c/s1-thumb.webp'),
  ('EE', '20c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/20c/s1.webp', 'assets/coins/ee/20c/s1-thumb.webp'),
  ('EE', '50c', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/50c/s1.webp', 'assets/coins/ee/50c/s1-thumb.webp'),
  ('EE', '1e', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/1e/s1.webp', 'assets/coins/ee/1e/s1-thumb.webp'),
  ('EE', '2e', 1, '2011–present', 2011, 'Single series', 'assets/coins/ee/2e/s1.webp', 'assets/coins/ee/2e/s1-thumb.webp'),
  ('FI', '1c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/1c/s1.webp', 'assets/coins/fi/1c/s1-thumb.webp'),
  ('FI', '2c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/2c/s1.webp', 'assets/coins/fi/2c/s1-thumb.webp'),
  ('FI', '5c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/5c/s1.webp', 'assets/coins/fi/5c/s1-thumb.webp'),
  ('FI', '10c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/10c/s1.webp', 'assets/coins/fi/10c/s1-thumb.webp'),
  ('FI', '20c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/20c/s1.webp', 'assets/coins/fi/20c/s1-thumb.webp'),
  ('FI', '50c', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/50c/s1.webp', 'assets/coins/fi/50c/s1-thumb.webp'),
  ('FI', '1e', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/1e/s1.webp', 'assets/coins/fi/1e/s1-thumb.webp'),
  ('FI', '2e', 1, '1999–present', 1999, 'Single series', 'assets/coins/fi/2e/s1.webp', 'assets/coins/fi/2e/s1-thumb.webp'),
  ('FR', '1c', 1, '1999–present', 1999, 'Marianne (Fabienne Courtiade)', 'assets/coins/fr/1c/s1.webp', 'assets/coins/fr/1c/s1-thumb.webp'),
  ('FR', '2c', 1, '1999–present', 1999, 'Marianne (Fabienne Courtiade)', 'assets/coins/fr/2c/s1.webp', 'assets/coins/fr/2c/s1-thumb.webp'),
  ('FR', '5c', 1, '1999–present', 1999, 'Marianne (Fabienne Courtiade)', 'assets/coins/fr/5c/s1.webp', 'assets/coins/fr/5c/s1-thumb.webp'),
  ('FR', '10c', 1, '1999–2023', 1999, 'The sower (Laurent Jorlo)', 'assets/coins/fr/10c/s1.webp', 'assets/coins/fr/10c/s1-thumb.webp'),
  ('FR', '10c', 2, '2024–present', 2024, 'Simone Veil', 'assets/coins/fr/10c/s2.webp', 'assets/coins/fr/10c/s2-thumb.webp'),
  ('FR', '20c', 1, '1999–2023', 1999, 'The sower (Laurent Jorlo)', 'assets/coins/fr/20c/s1.webp', 'assets/coins/fr/20c/s1-thumb.webp'),
  ('FR', '20c', 2, '2024–present', 2024, 'Josephine Baker', 'assets/coins/fr/20c/s2.webp', 'assets/coins/fr/20c/s2-thumb.webp'),
  ('FR', '50c', 1, '1999–2023', 1999, 'The sower (Laurent Jorlo)', 'assets/coins/fr/50c/s1.webp', 'assets/coins/fr/50c/s1-thumb.webp'),
  ('FR', '50c', 2, '2024–present', 2024, 'Marie Curie', 'assets/coins/fr/50c/s2.webp', 'assets/coins/fr/50c/s2-thumb.webp'),
  ('FR', '1e', 1, '1999–2021', 1999, 'Tree of life (Joaquin Jimenez)', 'assets/coins/fr/1e/s1.webp', 'assets/coins/fr/1e/s1-thumb.webp'),
  ('FR', '1e', 2, '2022–present', 2022, 'Oak and olive tree of life', 'assets/coins/fr/1e/s2.webp', 'assets/coins/fr/1e/s2-thumb.webp'),
  ('FR', '2e', 1, '1999–2021', 1999, 'Tree of life (Joaquin Jimenez)', 'assets/coins/fr/2e/s1.webp', 'assets/coins/fr/2e/s1-thumb.webp'),
  ('FR', '2e', 2, '2022–present', 2022, 'Oak and olive tree of life', 'assets/coins/fr/2e/s2.webp', 'assets/coins/fr/2e/s2-thumb.webp'),
  ('DE', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/1c/s1.webp', 'assets/coins/de/1c/s1-thumb.webp'),
  ('DE', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/2c/s1.webp', 'assets/coins/de/2c/s1-thumb.webp'),
  ('DE', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/5c/s1.webp', 'assets/coins/de/5c/s1-thumb.webp'),
  ('DE', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/10c/s1.webp', 'assets/coins/de/10c/s1-thumb.webp'),
  ('DE', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/20c/s1.webp', 'assets/coins/de/20c/s1-thumb.webp'),
  ('DE', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/50c/s1.webp', 'assets/coins/de/50c/s1-thumb.webp'),
  ('DE', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/1e/s1.webp', 'assets/coins/de/1e/s1-thumb.webp'),
  ('DE', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/de/2e/s1.webp', 'assets/coins/de/2e/s1-thumb.webp'),
  ('GR', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/1c/s1.webp', 'assets/coins/gr/1c/s1-thumb.webp'),
  ('GR', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/2c/s1.webp', 'assets/coins/gr/2c/s1-thumb.webp'),
  ('GR', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/5c/s1.webp', 'assets/coins/gr/5c/s1-thumb.webp'),
  ('GR', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/10c/s1.webp', 'assets/coins/gr/10c/s1-thumb.webp'),
  ('GR', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/20c/s1.webp', 'assets/coins/gr/20c/s1-thumb.webp'),
  ('GR', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/50c/s1.webp', 'assets/coins/gr/50c/s1-thumb.webp'),
  ('GR', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/1e/s1.webp', 'assets/coins/gr/1e/s1-thumb.webp'),
  ('GR', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/gr/2e/s1.webp', 'assets/coins/gr/2e/s1-thumb.webp'),
  ('IE', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/1c/s1.webp', 'assets/coins/ie/1c/s1-thumb.webp'),
  ('IE', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/2c/s1.webp', 'assets/coins/ie/2c/s1-thumb.webp'),
  ('IE', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/5c/s1.webp', 'assets/coins/ie/5c/s1-thumb.webp'),
  ('IE', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/10c/s1.webp', 'assets/coins/ie/10c/s1-thumb.webp'),
  ('IE', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/20c/s1.webp', 'assets/coins/ie/20c/s1-thumb.webp'),
  ('IE', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/50c/s1.webp', 'assets/coins/ie/50c/s1-thumb.webp'),
  ('IE', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/1e/s1.webp', 'assets/coins/ie/1e/s1-thumb.webp'),
  ('IE', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/ie/2e/s1.webp', 'assets/coins/ie/2e/s1-thumb.webp'),
  ('IT', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/1c/s1.webp', 'assets/coins/it/1c/s1-thumb.webp'),
  ('IT', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/2c/s1.webp', 'assets/coins/it/2c/s1-thumb.webp'),
  ('IT', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/5c/s1.webp', 'assets/coins/it/5c/s1-thumb.webp'),
  ('IT', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/10c/s1.webp', 'assets/coins/it/10c/s1-thumb.webp'),
  ('IT', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/20c/s1.webp', 'assets/coins/it/20c/s1-thumb.webp'),
  ('IT', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/50c/s1.webp', 'assets/coins/it/50c/s1-thumb.webp'),
  ('IT', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/1e/s1.webp', 'assets/coins/it/1e/s1-thumb.webp'),
  ('IT', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/it/2e/s1.webp', 'assets/coins/it/2e/s1-thumb.webp'),
  ('LV', '1c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/1c/s1.webp', 'assets/coins/lv/1c/s1-thumb.webp'),
  ('LV', '2c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/2c/s1.webp', 'assets/coins/lv/2c/s1-thumb.webp'),
  ('LV', '5c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/5c/s1.webp', 'assets/coins/lv/5c/s1-thumb.webp'),
  ('LV', '10c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/10c/s1.webp', 'assets/coins/lv/10c/s1-thumb.webp'),
  ('LV', '20c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/20c/s1.webp', 'assets/coins/lv/20c/s1-thumb.webp'),
  ('LV', '50c', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/50c/s1.webp', 'assets/coins/lv/50c/s1-thumb.webp'),
  ('LV', '1e', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/1e/s1.webp', 'assets/coins/lv/1e/s1-thumb.webp'),
  ('LV', '2e', 1, '2014–present', 2014, 'Single series', 'assets/coins/lv/2e/s1.webp', 'assets/coins/lv/2e/s1-thumb.webp'),
  ('LT', '1c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/1c/s1.webp', 'assets/coins/lt/1c/s1-thumb.webp'),
  ('LT', '2c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/2c/s1.webp', 'assets/coins/lt/2c/s1-thumb.webp'),
  ('LT', '5c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/5c/s1.webp', 'assets/coins/lt/5c/s1-thumb.webp'),
  ('LT', '10c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/10c/s1.webp', 'assets/coins/lt/10c/s1-thumb.webp'),
  ('LT', '20c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/20c/s1.webp', 'assets/coins/lt/20c/s1-thumb.webp'),
  ('LT', '50c', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/50c/s1.webp', 'assets/coins/lt/50c/s1-thumb.webp'),
  ('LT', '1e', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/1e/s1.webp', 'assets/coins/lt/1e/s1-thumb.webp'),
  ('LT', '2e', 1, '2015–present', 2015, 'Single series', 'assets/coins/lt/2e/s1.webp', 'assets/coins/lt/2e/s1-thumb.webp'),
  ('LU', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/1c/s1.webp', 'assets/coins/lu/1c/s1-thumb.webp'),
  ('LU', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/2c/s1.webp', 'assets/coins/lu/2c/s1-thumb.webp'),
  ('LU', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/5c/s1.webp', 'assets/coins/lu/5c/s1-thumb.webp'),
  ('LU', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/10c/s1.webp', 'assets/coins/lu/10c/s1-thumb.webp'),
  ('LU', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/20c/s1.webp', 'assets/coins/lu/20c/s1-thumb.webp'),
  ('LU', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/50c/s1.webp', 'assets/coins/lu/50c/s1-thumb.webp'),
  ('LU', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/1e/s1.webp', 'assets/coins/lu/1e/s1-thumb.webp'),
  ('LU', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/lu/2e/s1.webp', 'assets/coins/lu/2e/s1-thumb.webp'),
  ('MT', '1c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/1c/s1.webp', 'assets/coins/mt/1c/s1-thumb.webp'),
  ('MT', '2c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/2c/s1.webp', 'assets/coins/mt/2c/s1-thumb.webp'),
  ('MT', '5c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/5c/s1.webp', 'assets/coins/mt/5c/s1-thumb.webp'),
  ('MT', '10c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/10c/s1.webp', 'assets/coins/mt/10c/s1-thumb.webp'),
  ('MT', '20c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/20c/s1.webp', 'assets/coins/mt/20c/s1-thumb.webp'),
  ('MT', '50c', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/50c/s1.webp', 'assets/coins/mt/50c/s1-thumb.webp'),
  ('MT', '1e', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/1e/s1.webp', 'assets/coins/mt/1e/s1-thumb.webp'),
  ('MT', '2e', 1, '2008–present', 2008, 'Single series', 'assets/coins/mt/2e/s1.webp', 'assets/coins/mt/2e/s1-thumb.webp'),
  ('MC', '1c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/1c/s1.webp', 'assets/coins/mc/1c/s1-thumb.webp'),
  ('MC', '1c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/1c/s2.webp', 'assets/coins/mc/1c/s2-thumb.webp'),
  ('MC', '1c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/1c/s3.webp', 'assets/coins/mc/1c/s3-thumb.webp'),
  ('MC', '2c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/2c/s1.webp', 'assets/coins/mc/2c/s1-thumb.webp'),
  ('MC', '2c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/2c/s2.webp', 'assets/coins/mc/2c/s2-thumb.webp'),
  ('MC', '2c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/2c/s3.webp', 'assets/coins/mc/2c/s3-thumb.webp'),
  ('MC', '5c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/5c/s1.webp', 'assets/coins/mc/5c/s1-thumb.webp'),
  ('MC', '5c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/5c/s2.webp', 'assets/coins/mc/5c/s2-thumb.webp'),
  ('MC', '5c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/5c/s3.webp', 'assets/coins/mc/5c/s3-thumb.webp'),
  ('MC', '10c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/10c/s1.webp', 'assets/coins/mc/10c/s1-thumb.webp'),
  ('MC', '10c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/10c/s2.webp', 'assets/coins/mc/10c/s2-thumb.webp'),
  ('MC', '10c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/10c/s3.webp', 'assets/coins/mc/10c/s3-thumb.webp'),
  ('MC', '20c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/20c/s1.webp', 'assets/coins/mc/20c/s1-thumb.webp'),
  ('MC', '20c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/20c/s2.webp', 'assets/coins/mc/20c/s2-thumb.webp'),
  ('MC', '20c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/20c/s3.webp', 'assets/coins/mc/20c/s3-thumb.webp'),
  ('MC', '50c', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/50c/s1.webp', 'assets/coins/mc/50c/s1-thumb.webp'),
  ('MC', '50c', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/50c/s2.webp', 'assets/coins/mc/50c/s2-thumb.webp'),
  ('MC', '50c', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/50c/s3.webp', 'assets/coins/mc/50c/s3-thumb.webp'),
  ('MC', '1e', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/1e/s1.webp', 'assets/coins/mc/1e/s1-thumb.webp'),
  ('MC', '1e', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/1e/s2.webp', 'assets/coins/mc/1e/s2-thumb.webp'),
  ('MC', '1e', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/1e/s3.webp', 'assets/coins/mc/1e/s3-thumb.webp'),
  ('MC', '2e', 1, '2001–2005', 2001, 'Prince Rainier III (first series, in circulation from 2002)', 'assets/coins/mc/2e/s1.webp', 'assets/coins/mc/2e/s1-thumb.webp'),
  ('MC', '2e', 2, '2006–2024', 2006, 'Prince Albert II', 'assets/coins/mc/2e/s2.webp', 'assets/coins/mc/2e/s2-thumb.webp'),
  ('MC', '2e', 3, '2025–present', 2025, 'Prince Albert II, frontal portrait', 'assets/coins/mc/2e/s3.webp', 'assets/coins/mc/2e/s3-thumb.webp'),
  ('NL', '1c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/1c/s1.webp', 'assets/coins/nl/1c/s1-thumb.webp'),
  ('NL', '1c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/1c/s2.webp', 'assets/coins/nl/1c/s2-thumb.webp'),
  ('NL', '2c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/2c/s1.webp', 'assets/coins/nl/2c/s1-thumb.webp'),
  ('NL', '2c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/2c/s2.webp', 'assets/coins/nl/2c/s2-thumb.webp'),
  ('NL', '5c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/5c/s1.webp', 'assets/coins/nl/5c/s1-thumb.webp'),
  ('NL', '5c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/5c/s2.webp', 'assets/coins/nl/5c/s2-thumb.webp'),
  ('NL', '10c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/10c/s1.webp', 'assets/coins/nl/10c/s1-thumb.webp'),
  ('NL', '10c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/10c/s2.webp', 'assets/coins/nl/10c/s2-thumb.webp'),
  ('NL', '20c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/20c/s1.webp', 'assets/coins/nl/20c/s1-thumb.webp'),
  ('NL', '20c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/20c/s2.webp', 'assets/coins/nl/20c/s2-thumb.webp'),
  ('NL', '50c', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/50c/s1.webp', 'assets/coins/nl/50c/s1-thumb.webp'),
  ('NL', '50c', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/50c/s2.webp', 'assets/coins/nl/50c/s2-thumb.webp'),
  ('NL', '1e', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/1e/s1.webp', 'assets/coins/nl/1e/s1-thumb.webp'),
  ('NL', '1e', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/1e/s2.webp', 'assets/coins/nl/1e/s2-thumb.webp'),
  ('NL', '2e', 1, '1999–2013', 1999, 'Queen Beatrix', 'assets/coins/nl/2e/s1.webp', 'assets/coins/nl/2e/s1-thumb.webp'),
  ('NL', '2e', 2, '2014–present', 2014, 'King Willem-Alexander', 'assets/coins/nl/2e/s2.webp', 'assets/coins/nl/2e/s2-thumb.webp'),
  ('PT', '1c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/1c/s1.webp', 'assets/coins/pt/1c/s1-thumb.webp'),
  ('PT', '2c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/2c/s1.webp', 'assets/coins/pt/2c/s1-thumb.webp'),
  ('PT', '5c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/5c/s1.webp', 'assets/coins/pt/5c/s1-thumb.webp'),
  ('PT', '10c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/10c/s1.webp', 'assets/coins/pt/10c/s1-thumb.webp'),
  ('PT', '20c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/20c/s1.webp', 'assets/coins/pt/20c/s1-thumb.webp'),
  ('PT', '50c', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/50c/s1.webp', 'assets/coins/pt/50c/s1-thumb.webp'),
  ('PT', '1e', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/1e/s1.webp', 'assets/coins/pt/1e/s1-thumb.webp'),
  ('PT', '2e', 1, '2002–present', 2002, 'Single series', 'assets/coins/pt/2e/s1.webp', 'assets/coins/pt/2e/s1-thumb.webp'),
  ('SM', '1c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/1c/s1.webp', 'assets/coins/sm/1c/s1-thumb.webp'),
  ('SM', '1c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/1c/s2.webp', 'assets/coins/sm/1c/s2-thumb.webp'),
  ('SM', '2c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/2c/s1.webp', 'assets/coins/sm/2c/s1-thumb.webp'),
  ('SM', '2c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/2c/s2.webp', 'assets/coins/sm/2c/s2-thumb.webp'),
  ('SM', '5c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/5c/s1.webp', 'assets/coins/sm/5c/s1-thumb.webp'),
  ('SM', '5c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/5c/s2.webp', 'assets/coins/sm/5c/s2-thumb.webp'),
  ('SM', '10c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/10c/s1.webp', 'assets/coins/sm/10c/s1-thumb.webp'),
  ('SM', '10c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/10c/s2.webp', 'assets/coins/sm/10c/s2-thumb.webp'),
  ('SM', '20c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/20c/s1.webp', 'assets/coins/sm/20c/s1-thumb.webp'),
  ('SM', '20c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/20c/s2.webp', 'assets/coins/sm/20c/s2-thumb.webp'),
  ('SM', '50c', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/50c/s1.webp', 'assets/coins/sm/50c/s1-thumb.webp'),
  ('SM', '50c', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/50c/s2.webp', 'assets/coins/sm/50c/s2-thumb.webp'),
  ('SM', '1e', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/1e/s1.webp', 'assets/coins/sm/1e/s1-thumb.webp'),
  ('SM', '1e', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/1e/s2.webp', 'assets/coins/sm/1e/s2-thumb.webp'),
  ('SM', '2e', 1, '2002–2016', 2002, 'First series', 'assets/coins/sm/2e/s1.webp', 'assets/coins/sm/2e/s1-thumb.webp'),
  ('SM', '2e', 2, '2017–present', 2017, 'Second series', 'assets/coins/sm/2e/s2.webp', 'assets/coins/sm/2e/s2-thumb.webp'),
  ('SK', '1c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/1c/s1.webp', 'assets/coins/sk/1c/s1-thumb.webp'),
  ('SK', '2c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/2c/s1.webp', 'assets/coins/sk/2c/s1-thumb.webp'),
  ('SK', '5c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/5c/s1.webp', 'assets/coins/sk/5c/s1-thumb.webp'),
  ('SK', '10c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/10c/s1.webp', 'assets/coins/sk/10c/s1-thumb.webp'),
  ('SK', '20c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/20c/s1.webp', 'assets/coins/sk/20c/s1-thumb.webp'),
  ('SK', '50c', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/50c/s1.webp', 'assets/coins/sk/50c/s1-thumb.webp'),
  ('SK', '1e', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/1e/s1.webp', 'assets/coins/sk/1e/s1-thumb.webp'),
  ('SK', '2e', 1, '2009–present', 2009, 'Single series', 'assets/coins/sk/2e/s1.webp', 'assets/coins/sk/2e/s1-thumb.webp'),
  ('SI', '1c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/1c/s1.webp', 'assets/coins/si/1c/s1-thumb.webp'),
  ('SI', '2c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/2c/s1.webp', 'assets/coins/si/2c/s1-thumb.webp'),
  ('SI', '5c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/5c/s1.webp', 'assets/coins/si/5c/s1-thumb.webp'),
  ('SI', '10c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/10c/s1.webp', 'assets/coins/si/10c/s1-thumb.webp'),
  ('SI', '20c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/20c/s1.webp', 'assets/coins/si/20c/s1-thumb.webp'),
  ('SI', '50c', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/50c/s1.webp', 'assets/coins/si/50c/s1-thumb.webp'),
  ('SI', '1e', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/1e/s1.webp', 'assets/coins/si/1e/s1-thumb.webp'),
  ('SI', '2e', 1, '2007–present', 2007, 'Single series', 'assets/coins/si/2e/s1.webp', 'assets/coins/si/2e/s1-thumb.webp'),
  ('ES', '1c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/1c/s1.webp', 'assets/coins/es/1c/s1-thumb.webp'),
  ('ES', '1c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/1c/s2.webp', 'assets/coins/es/1c/s2-thumb.webp'),
  ('ES', '2c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/2c/s1.webp', 'assets/coins/es/2c/s1-thumb.webp'),
  ('ES', '2c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/2c/s2.webp', 'assets/coins/es/2c/s2-thumb.webp'),
  ('ES', '5c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/5c/s1.webp', 'assets/coins/es/5c/s1-thumb.webp'),
  ('ES', '5c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/5c/s2.webp', 'assets/coins/es/5c/s2-thumb.webp'),
  ('ES', '10c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/10c/s1.webp', 'assets/coins/es/10c/s1-thumb.webp'),
  ('ES', '10c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/10c/s2.webp', 'assets/coins/es/10c/s2-thumb.webp'),
  ('ES', '20c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/20c/s1.webp', 'assets/coins/es/20c/s1-thumb.webp'),
  ('ES', '20c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/20c/s2.webp', 'assets/coins/es/20c/s2-thumb.webp'),
  ('ES', '50c', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/50c/s1.webp', 'assets/coins/es/50c/s1-thumb.webp'),
  ('ES', '50c', 2, '2010–present', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/50c/s2.webp', 'assets/coins/es/50c/s2-thumb.webp'),
  ('ES', '1e', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/1e/s1.webp', 'assets/coins/es/1e/s1-thumb.webp'),
  ('ES', '1e', 2, '2010–2014', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/1e/s2.webp', 'assets/coins/es/1e/s2-thumb.webp'),
  ('ES', '1e', 3, '2015–present', 2015, 'King Felipe VI', 'assets/coins/es/1e/s3.webp', 'assets/coins/es/1e/s3-thumb.webp'),
  ('ES', '2e', 1, '1999–2009', 1999, 'First series', 'assets/coins/es/2e/s1.webp', 'assets/coins/es/2e/s1-thumb.webp'),
  ('ES', '2e', 2, '2010–2014', 2010, 'Second series (redesign to EU guidelines)', 'assets/coins/es/2e/s2.webp', 'assets/coins/es/2e/s2-thumb.webp'),
  ('ES', '2e', 3, '2015–present', 2015, 'King Felipe VI', 'assets/coins/es/2e/s3.webp', 'assets/coins/es/2e/s3-thumb.webp'),
  ('VA', '1c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/1c/s1.webp', 'assets/coins/va/1c/s1-thumb.webp'),
  ('VA', '1c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/1c/s2.webp', 'assets/coins/va/1c/s2-thumb.webp'),
  ('VA', '1c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/1c/s3.webp', 'assets/coins/va/1c/s3-thumb.webp'),
  ('VA', '1c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/1c/s4.webp', 'assets/coins/va/1c/s4-thumb.webp'),
  ('VA', '1c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/1c/s5.webp', 'assets/coins/va/1c/s5-thumb.webp'),
  ('VA', '2c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/2c/s1.webp', 'assets/coins/va/2c/s1-thumb.webp'),
  ('VA', '2c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/2c/s2.webp', 'assets/coins/va/2c/s2-thumb.webp'),
  ('VA', '2c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/2c/s3.webp', 'assets/coins/va/2c/s3-thumb.webp'),
  ('VA', '2c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/2c/s4.webp', 'assets/coins/va/2c/s4-thumb.webp'),
  ('VA', '2c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/2c/s5.webp', 'assets/coins/va/2c/s5-thumb.webp'),
  ('VA', '5c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/5c/s1.webp', 'assets/coins/va/5c/s1-thumb.webp'),
  ('VA', '5c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/5c/s2.webp', 'assets/coins/va/5c/s2-thumb.webp'),
  ('VA', '5c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/5c/s3.webp', 'assets/coins/va/5c/s3-thumb.webp'),
  ('VA', '5c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/5c/s4.webp', 'assets/coins/va/5c/s4-thumb.webp'),
  ('VA', '5c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/5c/s5.webp', 'assets/coins/va/5c/s5-thumb.webp'),
  ('VA', '10c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/10c/s1.webp', 'assets/coins/va/10c/s1-thumb.webp'),
  ('VA', '10c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/10c/s2.webp', 'assets/coins/va/10c/s2-thumb.webp'),
  ('VA', '10c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/10c/s3.webp', 'assets/coins/va/10c/s3-thumb.webp'),
  ('VA', '10c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/10c/s4.webp', 'assets/coins/va/10c/s4-thumb.webp'),
  ('VA', '10c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/10c/s5.webp', 'assets/coins/va/10c/s5-thumb.webp'),
  ('VA', '20c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/20c/s1.webp', 'assets/coins/va/20c/s1-thumb.webp'),
  ('VA', '20c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/20c/s2.webp', 'assets/coins/va/20c/s2-thumb.webp'),
  ('VA', '20c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/20c/s3.webp', 'assets/coins/va/20c/s3-thumb.webp'),
  ('VA', '20c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/20c/s4.webp', 'assets/coins/va/20c/s4-thumb.webp'),
  ('VA', '20c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/20c/s5.webp', 'assets/coins/va/20c/s5-thumb.webp'),
  ('VA', '50c', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/50c/s1.webp', 'assets/coins/va/50c/s1-thumb.webp'),
  ('VA', '50c', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/50c/s2.webp', 'assets/coins/va/50c/s2-thumb.webp'),
  ('VA', '50c', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/50c/s3.webp', 'assets/coins/va/50c/s3-thumb.webp'),
  ('VA', '50c', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/50c/s4.webp', 'assets/coins/va/50c/s4-thumb.webp'),
  ('VA', '50c', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/50c/s5.webp', 'assets/coins/va/50c/s5-thumb.webp'),
  ('VA', '1e', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/1e/s1.webp', 'assets/coins/va/1e/s1-thumb.webp'),
  ('VA', '1e', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/1e/s2.webp', 'assets/coins/va/1e/s2-thumb.webp'),
  ('VA', '1e', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/1e/s3.webp', 'assets/coins/va/1e/s3-thumb.webp'),
  ('VA', '1e', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/1e/s4.webp', 'assets/coins/va/1e/s4-thumb.webp'),
  ('VA', '1e', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/1e/s5.webp', 'assets/coins/va/1e/s5-thumb.webp'),
  ('VA', '2e', 1, '2002–2005', 2002, 'Pope John Paul II', 'assets/coins/va/2e/s1.webp', 'assets/coins/va/2e/s1-thumb.webp'),
  ('VA', '2e', 2, '2005–2006', 2005, 'Sede Vacante', 'assets/coins/va/2e/s2.webp', 'assets/coins/va/2e/s2-thumb.webp'),
  ('VA', '2e', 3, '2006–2013', 2006, 'Pope Benedict XVI', 'assets/coins/va/2e/s3.webp', 'assets/coins/va/2e/s3-thumb.webp'),
  ('VA', '2e', 4, '2014–2016', 2014, 'Pope Francis', 'assets/coins/va/2e/s4.webp', 'assets/coins/va/2e/s4-thumb.webp'),
  ('VA', '2e', 5, '2017–present', 2017, 'Coat of arms of Pope Francis', 'assets/coins/va/2e/s5.webp', 'assets/coins/va/2e/s5-thumb.webp')
on conflict (country_code, denomination, series_no) do update set years = excluded.years, start_year = excluded.start_year, design = excluded.design, image_path = excluded.image_path, thumb_path = excluded.thumb_path;
