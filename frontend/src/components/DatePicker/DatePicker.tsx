import { Box } from "@chakra-ui/react";
import ReactDatePicker from "react-datepicker";

import "./styles.css";

// TODO Improve Styling
const DatePicker = (props: { date: Date; setDate: Function }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      height={"var(--chakra-sizes-10);"}
      cursor={"pointer"}
    >
      <ReactDatePicker
        selected={props.date}
        onChange={(date) => props.setDate(date!)}
      />
    </Box>
  );
};

export default DatePicker;
