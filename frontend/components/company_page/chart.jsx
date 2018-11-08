 import React from 'react';
import Chart from 'chart.js';
import moment from 'moment';
import transform from 'moment-transform';

import ChartOverlayContainer from './chart_overlay_container';

class ChartComponent extends React.Component {
  constructor(props) {
    super(props);
    const { companyStockData } = this.props;
    this.state = {
      intradayPricePoints: [],
      intradayTimePoints: [],
      dailyPricePoints: [],
      dailyTimePoints: [],
      graphTimePoints: [],
      graphPricePoints: [],
      historicalPercDelta: "",
      historicalPriceDelta: "",
      numRenders: 0,
      chart: '',
    };
    this.changeActive = this.changeActive.bind(this);
    this.renderChart = this.renderChart.bind(this);
    // console.log(moment("2017-12-05 14:12:00").format("h:mm A")); // Day
    // console.log(moment("2017-12-05 14:12:00").format("h:mm A, MMM D")); // Week
    // console.log(moment("2017-12-05 14:12:00").format("MMM D")); // Month
  }

  firstMin() {
    const midnight = moment().transform('00:00:00.000').format("YYYY-MM-DD HH:mm:ss");
    const marketOpen = moment().transform('10:00:00.000').format("YYYY-MM-DD HH:mm:ss");
    const now = moment().format("YYYY-MM-DD HH:mm:ss");
    if (moment().isoWeekday() === 6) {
      return moment().subtract(1, 'days').transform('09:30:00.000').format("YYYY-MM-DD HH:mm:ss");
    } else if (moment().isoWeekday() === 7) {
      return moment().subtract(2, 'days').transform('09:30:00.000').format("YYYY-MM-DD HH:mm:ss");
    } else if (midnight < now && now < marketOpen ) {
      return moment().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
    } else {
      return moment().transform('09:30:00.000').format("YYYY-MM-DD HH:mm:ss");
    }
  }

  closingPrice() {
    let closingTime = moment().transform('YYYY-MM-DD 09:30:00.000').format("YYYY-MM-DD HH:mm:ss");
    let idx = this.state.intradayTimePoints.indexOf(closingTime);
    if (idx === -1) {
      closingTime = moment().transform('YYYY-MM-DD 09:35:00.000').format("YYYY-MM-DD HH:mm:ss");
      idx = this.state.intradayTimePoints.indexOf(closingTime);
    }
    const closingPrice = this.state.intradayPricePoints[idx - 1];
    return closingPrice;
  }

  setClosingArr(closingPrice, labels) {
    let blankArr = new Array(labels.length);
    return blankArr.fill(closingPrice);
  }

  idxRange(timeArr, minDate) {
    const idxRange = [];
    const now = new Date;
    const prevDate = new Date(minDate);
    timeArr.forEach((dateStr, idx) => {
      const date = new Date(dateStr);
      if (date > prevDate && date < now) {
        idxRange.push(idx);
      }
    });
    return idxRange;
  }

  timesWithinRange(timeArr, minDate) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@")
    // console.log("inside timeWithinRange")
    
    console.log(timeArr)
    console.log(minDate)
    // console.log("outside timeWithinRange")
    
    const now = new Date;
    const prevDate = new Date(minDate);
    // console.log(now)
    // console.log(timeArr[0])
    // console.log(new Date(timeArr[0]) < now, "testing..." )
    console.log("@@@@@@@@@@@@@@@@@@@@@@@")
    let temp = timeArr.filter(dateStr => {
      const date = new Date(dateStr);
    
      if (date > prevDate && date < now) {
     
        
        return date;
      }
    });
    // console.log('temp begin')
    // console.log(temp)
    

    // console.log('temp end')
    return temp
  }

  pricesWithinRange(prices, range) {
    // return prices.filter( (price, idx) => {
    //   if (range.includes(idx)) return price;
    // });
    const pricesInRange = [];
    range.forEach (idx => {
      pricesInRange.push(prices[idx]);
    });
    return pricesInRange;
  }

  componentWillReceiveProps(nextProps) {
    console.log("nextProps begin")
    console.log(nextProps)
    console.log("nextProps end")
    if (
      ( nextProps.companyStockData &&
      nextProps.companyStockData.intraday &&
      nextProps.companyStockData.daily &&
      !nextProps.companyLoading )
    ) {
      const firstMin = this.firstMin();
      const intradayPrices = nextProps.companyStockData.intraday.prices;
      const intradayTime = nextProps.companyStockData.intraday.time;
      const dailyPrices = nextProps.companyStockData.daily.prices;
      const dailyTime = nextProps.companyStockData.daily.time;
      const idxRange = this.idxRange(intradayTime, firstMin);
      this.setState({
        intradayPricePoints: intradayPrices,
        intradayTimePoints: intradayTime,
        dailyPricePoints: dailyPrices,
        dailyTimePoints: dailyTime,
        graphTimePoints: this.timesWithinRange(intradayTime, firstMin),
        graphPricePoints: this.pricesWithinRange(intradayPrices, idxRange),
        numRenders: this.state.numRenders + 1,
      }, () => {
        if (this.state.numRenders === 1) {
          this.renderChart();
        }
      });
    } else if
    (nextProps.match.params.symbol !== this.props.match.params.symbol)
    {
      const { symbol } = nextProps.match.params;
      if (!nextProps.companyStockData) {
        this.props.fetchRealtimeIntradayData(symbol)
          .then(() => this.renderChart());
        this.props.fetchRealtimeDailyData(symbol);
      }
    }
  }

  componentWillMount() {
    this.fetchRealtimePrices();
  }

  fetchRealtimePrices() {
    const { symbol } = this.props.match.params;
    const { companyStockData } = this.props;
    if (!companyStockData) {
      this.props.fetchRealtimeIntradayData(symbol);
      this.props.fetchRealtimeDailyData(symbol);
      
    }
  }

  compareHistoricalPrices() {
    const {
      graphPricePoints,
      intradayPricePoints,
      timeSeries
    } = this.state;
    const closingPrice = this.closingPrice();
    const lastPrice = (timeSeries === "today") ? closingPrice : graphPricePoints[0];
    
    const latestPrice = intradayPricePoints[intradayPricePoints.length - 1];
    const priceDiff = parseFloat(latestPrice) - parseFloat(lastPrice);
    const percDiff = (priceDiff / parseFloat(lastPrice)) * 100;
    // console.log("*******")
    // console.log(timeSeries)
    // console.log("closing price", closingPrice)
    // console.log(latestPrice)
    
    // console.log(graphPricePoints[0])
    
    // console.log(graphPricePoints)

    // console.log("*******")
    this.setState({historicalPriceDelta: priceDiff, historicalPercDelta: percDiff});
    return priceDiff;
  }

  renderChart() {
    // console.log('in renderChart')
    // console.log(this.state)
    // console.log('after this.state')
    const { graphPricePoints, graphTimePoints } = this.state;
    const closingPrice = this.closingPrice();
    const lastIdx = graphPricePoints.length - 1;
    this.compareHistoricalPrices();
    let graphColor;
    if (parseFloat(graphPricePoints[0]) < parseFloat(graphPricePoints[lastIdx])) {
      graphColor = "#08d093";
    } else {
      graphColor = "#f45531";
    }
    let stocksCanvas = document.getElementById("companyChart");
    let stocksCtx = stocksCanvas.getContext('2d');
    stocksCtx.clearRect(0, 0, stocksCanvas.width, stocksCanvas.height);
    new Chart(stocksCtx, {
      type: 'line',
      data: {
          datasets: [
            {
              fill: false,
              lineTension: 0.1,
              borderColor: graphColor,
              borderWidth: 2,
              pointRadius: .1,
              pointStyle: "circle",
              data: graphPricePoints,
            }, {
              fill: false,
              lineTension: .1,
              borderColor: "#b1bfc4",
              borderWidth: 1,
              pointRadius: 0,
              borderDash: [5, 5],
              pointStyle: "circle",
              data: this.setClosingArr(closingPrice, graphTimePoints)
            },
          ],
          labels: graphTimePoints,
      },
      options: {
        legend: {
          display: false,
        },
        scales: {
          xAxes: [{
            display: false,
          }],
          yAxes: [{
                display: false,
                gridLines : {
                    display : false
                }
            }]
          },
        }
      }
    );
  }

  changeActive(strNum) {
    // console.log('in change active')
    // console.log(strNum, typeof strNum)
    // console.log(this.state.intradayTimePoints);
    // console.log(this.state.intradayPricePoints);
    // console.log(this.state.dailyTimePoints);
    // console.log(this.state.dailyPricePoints);
    const now = new Date();
    let minDate, timeArr, prices, timeSeries;
    if (strNum === "1") {
      // console.log("inside today")
      // Today
      minDate = this.firstMin();
      timeArr = this.state.intradayTimePoints;
      prices = this.state.intradayPricePoints;
      timeSeries = "today";
    } else if (strNum === "2") {
      // console.log("inside week")
      // 1W
      minDate = moment(now).subtract(1, 'weeks').format("YYYY-MM-DD HH:mm:ss");
      // console.log(minDate, "min date")
      timeArr = this.state.intradayTimePoints;
      prices = this.state.intradayPricePoints;
      timeSeries = "1W";
    } else if (strNum === "3") {
      // console.log("inside 1M")
      // 1M
      minDate = moment(now).subtract(1, 'months').format("YYYY-MM-DD");
      // console.log("before minDate")
      // console.log(minDate)
      // console.log("after minDate")
      timeArr = this.state.dailyTimePoints;
      prices = this.state.dailyPricePoints;

      // console.log(timeArr)
      // console.log(prices)
      // console.log('end of strNum === 3')
      timeSeries = "1M";
    } else if (strNum === "4") {
      // 3M
      minDate = moment(now).subtract(3, 'months').format("YYYY-MM-DD");
      timeArr = this.state.dailyTimePoints;
      prices = this.state.dailyPricePoints;
      timeSeries = "3M";
    } else if (strNum === "5") {
      // 1Y
      minDate = moment(now).subtract(1, 'years').format("YYYY-MM-DD");
      timeArr = this.state.dailyTimePoints;
      prices = this.state.dailyPricePoints;
      timeSeries = "1Y";
    } else if (strNum === "6") {
      // 5Y
      minDate = moment(now).subtract(5, 'years').format("YYYY-MM-DD");
      timeArr = this.state.dailyTimePoints;
      prices = this.state.dailyPricePoints;
      timeSeries = "5Y";
    }
    const idxRange = this.idxRange(timeArr, minDate);
    const timesWithinRange = this.timesWithinRange(timeArr, minDate);
    const pricesWithinRange = this.pricesWithinRange(prices, idxRange);
    // console.log("test begin")
    // console.log(timeArr, minDate);
    // console.log("test end")
    // console.log("!!!!!!!!")
    // console.log("pricesWithinRange", pricesWithinRange)
    this.setState({
      graphTimePoints: timesWithinRange,
      graphPricePoints: pricesWithinRange,
      idxRange: idxRange,
      timeSeries,
    }, () => {
      // console.log('after setstate')
      // console.log(this.state);
      this.renderChart();
    });
   
  }

  render() {
    const { companyLoading, intradayApiLoading, dailyApiLoading } = this.props;
    const { imgUrl } = this.state;
    let canvasContainer = (
      <div className="line-chart-container">
        <canvas id="companyChart" className="line-chart"></canvas>
      </div>
    );
    if (companyLoading) {
      return (
        canvasContainer
      );
    } else {
      let canvas;
      if (!intradayApiLoading && !dailyApiLoading) {
        canvas = canvasContainer;
      } else {
        canvas = (
          <div className="spinner-chart-container">
            <div className="sk-circle">
              <div className="sk-circle1 sk-child"></div>
              <div className="sk-circle2 sk-child"></div>
              <div className="sk-circle3 sk-child"></div>
              <div className="sk-circle4 sk-child"></div>
              <div className="sk-circle5 sk-child"></div>
              <div className="sk-circle6 sk-child"></div>
              <div className="sk-circle7 sk-child"></div>
              <div className="sk-circle8 sk-child"></div>
              <div className="sk-circle9 sk-child"></div>
              <div className="sk-circle10 sk-child"></div>
              <div className="sk-circle11 sk-child"></div>
              <div className="sk-circle12 sk-child"></div>
            </div>
          </div>
        );
      }

      
      return (
        <div className="chart">
          {canvas}
          {/* {console.log("in chart jsx")}
          {console.log(this.state.historicalPriceDelta)}
          {console.log(this.state.historicalPercDelta)} */}
          <ChartOverlayContainer
            changeActive={this.changeActive}
            historicalPriceDelta={this.state.historicalPriceDelta}
            historicalPercDelta={this.state.historicalPercDelta}
          />
        </div>
      );
    }
  }
}

export default ChartComponent;
