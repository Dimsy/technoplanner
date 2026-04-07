const reportWebVitals = onPerfEntry => {
  // web-vitals is not available, so we'll just call the callback if provided
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Simulate web-vitals callback with empty data
    console.log('web-vitals is not installed. Performance monitoring disabled.');
    // You can optionally call onPerfEntry with mock data
    // onPerfEntry({ name: 'mock', value: 0 });
  }
};

export default reportWebVitals;
