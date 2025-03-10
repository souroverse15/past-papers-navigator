import { Button } from "@mui/material";

export default function FileLinks({ file }) {
  if (!file) return null;

  return (
    <div className="mt-4">
      <Button
        onClick={() => window.open(file.qp, "_blank")}
        variant="contained"
      >
        View Paper
      </Button>
      <Button
        onClick={() => window.open(file.ms, "_blank")}
        variant="contained"
        className="ml-2"
      >
        Mark Scheme
      </Button>
      <Button
        onClick={() => window.open(file.sp, "_blank")}
        variant="contained"
        className="ml-2"
      >
        Solved Paper
      </Button>
    </div>
  );
}
