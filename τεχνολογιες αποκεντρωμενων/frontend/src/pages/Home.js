import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { coursesAPI } from '../services/api';
import SearchIcon from '@mui/icons-material/Search';

function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    language: '',
    level: '',
    category: '',
    source: ''
  });

  const { data: filterOptions } = useQuery('filterOptions', coursesAPI.getFilterOptions);
  const { data, isLoading, error } = useQuery(
    ['courses', page, search, filters],
    () => coursesAPI.getAll({
      page,
      limit: 12,
      search: search || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    }),
    { keepPreviousData: true }
  );

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ language: '', level: '', category: '', source: '' });
    setSearch('');
    setPage(1);
  };

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Error loading courses. Please check if the backend is running.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Course Repository
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Discover and explore open courses from multiple platforms
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search courses..."
          value={search}
          onChange={handleSearch}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={filters.language}
                label="Language"
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions?.languages?.map(lang => (
                  <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions?.levels?.map(level => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions?.categories?.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={filters.source}
                label="Source"
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions?.sources?.map(source => (
                  <MenuItem key={source} value={source}>{source}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {(search || Object.values(filters).some(v => v)) && (
          <Button onClick={clearFilters} variant="outlined" size="small">
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Results */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {data?.pagination?.total || 0} courses
          </Typography>

          <Grid container spacing={3}>
            {data?.courses?.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {course.shortDescription || course.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip label={course.level} size="small" color="primary" variant="outlined" />
                      <Chip label={course.language} size="small" />
                      <Chip label={course.source.repositoryName} size="small" color="secondary" />
                    </Box>
                    {course.category && (
                      <Typography variant="caption" color="text.secondary">
                        Category: {course.category}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to={`/course/${course._id}`}>
                      View Details
                    </Button>
                    <Button size="small" href={course.accessLink} target="_blank" rel="noopener noreferrer">
                      Access Course
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {data?.pagination?.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={data.pagination.pages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Home;

