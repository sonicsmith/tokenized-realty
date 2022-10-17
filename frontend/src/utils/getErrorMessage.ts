// TODO: Construct error message from error type

export const getErrorMessage = (error: Error): string => {
  switch (error.constructor) {
    default:
      return error.message;
  }
};
