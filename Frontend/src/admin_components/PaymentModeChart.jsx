import React from 'react';
import Chart from 'react-apexcharts';

const PaymentModeChart = ({ data }) => {
  const chartOptions = {
    chart: {
      type: 'bar',
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        distributed: true, // Enable distributed colors for each bar
      },
    },
    colors: ['#1E90FF', '#FF6347', '#32CD32', '#F39C12', '#8A2BE2', '#FF69B4'], // Six unique colors
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data.map(item => item.mode), // Display payment modes on x-axis
      labels: {
        show: false, // Hide labels under each bar
      },
    },
    title: {
      text: 'Payment Methods',
      style: {fontSize:"20px",fontWeight:"bold",color:"black"},
      align: 'center',
    },
    tooltip: {
      y: {
        formatter: val => `${val}`,
      },
    },
  };

  const chartSeries = [
    {
      name: 'Transactions',
      data: data.map(item => item.count), // Count of each payment mode
    },
  ];

  return (
    <div>
      <Chart options={chartOptions} series={chartSeries} type="bar" height={350} width={520} />
    </div>
  );
};

export default PaymentModeChart;
