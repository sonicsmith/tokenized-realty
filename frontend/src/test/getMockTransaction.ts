const wait = () => {
  return new Promise((res) => {
    setTimeout(res, 3000);
  });
};

export const getMockTransaction = () => {
  return () => {
    return new Promise((res) => {
      setTimeout(() => res({ wait }), 3000);
    });
  };
};
