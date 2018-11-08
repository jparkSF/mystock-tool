export const fetchCompanies = () => (
  $.ajax({
    method: 'GET',
    url: '/api/companies'
  })
);

export const fetchCompany = id => (
  $.ajax({
    method: 'GET',
    url: `/api/companies/${id}`
  })
);

export const fetchRealtimeIntradayData = sym => (
  $.ajax({
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${sym}&outputsize=full&apikey=${API_OPTIONS.alphaVantageApiKey}&interval=5min`,
    type: "GET",
    dataType: "JSON",
  })
);

export const fetchRealtimeDailyData = sym => (
  $.ajax({
    headers: {
      "Authorization": `Bearer ${API_OPTIONS.intrinioApiKey}`
    },
    
    url: `https://api.intrinio.com/historical_data?identifier=${sym}&start_date=2014-02-27&item=adj_close_price&page_size=2000&sort_order=asc`,
    type: "GET",
    dataType: "JSON",
    
  })
);
