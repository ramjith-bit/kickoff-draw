/* Star-rating snapshot: Sports Illustrated, 6 September 2025 (updated 30 September).
   https://www.si.com/soccer/32-highest-rated-teams-ea-sports-fc-26-revealed
   A starter selection, not the complete Kick Off database. No official crest assets. */
(function (root) {
  const rows = [
    ['real-madrid-m','Real Madrid','LaLiga','Spain','men',5],
    ['barcelona-m','Barcelona','LaLiga','Spain','men',5],
    ['psg-m','Paris Saint-Germain','Ligue 1','France','men',5],
    ['liverpool-m','Liverpool','Premier League','England','men',5],
    ['man-city-m','Manchester City','Premier League','England','men',5],
    ['arsenal-m','Arsenal','Premier League','England','men',5],
    ['bayern-m','Bayern Munich','Bundesliga','Germany','men',5],
    ['atletico-m','Atlético Madrid','LaLiga','Spain','men',4.5],
    ['newcastle-m','Newcastle United','Premier League','England','men',4.5],
    ['napoli-m','Napoli','Serie A','Italy','men',4.5],
    ['dortmund-m','Borussia Dortmund','Bundesliga','Germany','men',4.5],
    ['tottenham-m','Tottenham Hotspur','Premier League','England','men',4.5],
    ['chelsea-m','Chelsea','Premier League','England','men',4.5],
    ['aston-villa-m','Aston Villa','Premier League','England','men',4.5],
    ['man-utd-m','Manchester United','Premier League','England','men',4.5],
    ['leverkusen-m','Bayer Leverkusen','Bundesliga','Germany','men',4.5],
    ['barcelona-w','Barcelona','Liga F','Spain','women',5],
    ['lyon-w','Olympique Lyon','Première Ligue','France','women',5],
    ['chelsea-w','Chelsea','WSL','England','women',5],
    ['arsenal-w','Arsenal','WSL','England','women',5],
    ['bayern-w','Bayern Munich','Frauen-Bundesliga','Germany','women',5],
    ['real-madrid-w','Real Madrid','Liga F','Spain','women',4.5],
    ['psg-w','Paris Saint-Germain','Première Ligue','France','women',4.5],
    ['man-city-w','Manchester City','WSL','England','women',4.5],
    ['wolfsburg-w','Wolfsburg','Frauen-Bundesliga','Germany','women',4.5],
    ['man-utd-w','Manchester United','WSL','England','women',4.5],
    ['kansas-city-w','Kansas City Current','NWSL','United States','women',4.5],
    ['washington-w','Washington Spirit','NWSL','United States','women',4],
    ['frankfurt-w','Eintracht Frankfurt','Frauen-Bundesliga','Germany','women',4],
    ['gotham-w','NJ/NY Gotham','NWSL','United States','women',4],
    ['juventus-w','Juventus','Serie A Women','Italy','women',4],
    ['orlando-w','Orlando Pride','NWSL','United States','women',4]
  ];
  const teams = rows.map(([id,name,league,country,gender,stars]) => ({id,name,league,country,gender,stars,kind:'club',custom:false}));
  if (typeof module === 'object' && module.exports) module.exports = teams;
  else root.STARTER_TEAMS = teams;
})(typeof globalThis !== 'undefined' ? globalThis : this);
