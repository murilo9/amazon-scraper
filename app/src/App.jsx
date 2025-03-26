import {
  Container,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Box,
  Divider,
} from "@mui/material";
import { Close, Search, Star } from "@mui/icons-material";
import { useState } from "react";

function App() {
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState({
    message: "",
    type: "inherit",
  });
  const [results, setResults] = useState(null);

  const onSearch = async () => {
    setFetchStatus({ message: "Fetching", type: "inherit" });
    setResults(null);
    if (search.trim()) {
      try {
        setFetching(true);
        const fetchTimeout = setTimeout(
          () =>
            setFetchStatus({
              message:
                "Amazon is not collaborating 🙄. Still waiting for data...",
              type: "warning",
            }),
          8 * 1000
        );
        const formattedSearch = search.trim().split(" ").join("+");
        const request = await fetch(
          `http://localhost:3000/api/scrape?keyword=${formattedSearch}`
        );
        clearTimeout(fetchTimeout);
        const response = await request.json();
        setResults(response);
        setFetchStatus({
          message: "",
          type: "inherit",
        });
      } catch (error) {
        console.log(error);
        setFetchStatus({
          message: "Couldn't retrieve data 🤦‍♂️. Please try again.",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    }
  };

  const onKeyUp = (event) => {
    if (event.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Stack
      maxWidth="sm"
      justifyContent="center"
      alignItems="flex-end"
      sx={{ m: "auto", height: "100vh", px: { xs: 2 } }}
    >
      <Typography variant="h5" fullWidth sx={{ width: "100%" }}>
        A patient Amazon Scraper
      </Typography>
      <Typography variant="caption" sx={{ mb: 3, width: "100%" }}>
        (But not too much)
      </Typography>
      <TextField
        label="Search something"
        fullWidth
        sx={{ mb: 2 }}
        autoFocus
        value={search}
        onKeyUp={onKeyUp}
        onChange={({ target: { value } }) => setSearch(value)}
        slotProps={{
          input: {
            endAdornment: search.trim() ? (
              <IconButton onClick={() => setSearch("")}>
                <Close />
              </IconButton>
            ) : null,
          },
        }}
      />
      {fetchStatus.message ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          {fetching ? <CircularProgress size={16} /> : null}
          <Typography color={fetchStatus.type || "inherit"}>
            {fetchStatus.message}
          </Typography>
        </Stack>
      ) : null}
      {fetching ? null : (
        <Button variant="contained" disableElevation onClick={onSearch}>
          Search
        </Button>
      )}
      {results !== null ? (
        results.length ? (
          <Box sx={{ overflow: "auto", flex: 1, mt: 2 }}>
            <Stack spacing={2}>
              {results.map((product, index) => (
                <>
                  {index ? <Divider /> : null}
                  <Card
                    key={product.name}
                    elevation={0}
                    sx={{ display: "flex", gap: "16px", p: 1 }}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{
                        width: "180px",
                        height: "180px",
                        objectFit: "contain",
                      }}
                    />
                    <CardContent
                      sx={{
                        flex: "1 1",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={500}
                        sx={{ mb: 2 }}
                      >
                        {product.title}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="flex-end"
                        justifyContent="space-between"
                      >
                        <Stack
                          direction="row"
                          alignItems="flex-end"
                          spacing={1}
                        >
                          <Star sx={{ color: "gold", fontSize: "24px" }} />
                          <Typography variant="h6" lineHeight="24px">
                            {product.rating}
                          </Typography>
                          <Typography color="textSecondary" fontSize="14px">
                            ({product.ratingsAmount})
                          </Typography>
                        </Stack>
                        <Typography variant="h5" color="success">
                          {product.price}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </>
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography>No results</Typography>
        )
      ) : null}
    </Stack>
  );
}

export default App;
