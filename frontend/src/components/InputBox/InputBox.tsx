import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/react";

const InputBox = (props: {
  title: string;
  subtext: string;
  type?: string;
  value: any;
  setValue: Function;
}) => {
  const { title, type, subtext } = props;
  return (
    <FormControl>
      <FormLabel>{title}</FormLabel>
      <Input type={type} />
      <FormHelperText>{subtext}</FormHelperText>
    </FormControl>
  );
};

export default InputBox;
