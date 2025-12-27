import React from 'react';
import { useQuery } from 'react-query';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { analyticsAPI } from '../services/api';
import BarChartIcon from '@mui/icons-material/BarChart';

function Analytics() {
  const { data, isLoading, error } = useQuery('analytics', analyticsAPI.getAnalytics);

  if (isLoading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Error loading analytics data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <BarChartIcon sx={{ mr: 2, fontSize: 40 }} />
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Total Courses */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Courses
              </Typography>
              <Typography variant="h3">
                {data?.totalCourses || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Courses by Source */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Courses by Source
              </Typography>
              <List>
                {data?.coursesBySource?.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={item._id}
                      secondary={`${item.count} courses`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Courses by Level */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Courses by Level
              </Typography>
              <List>
                {data?.coursesByLevel?.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={item._id || 'Unknown'}
                      secondary={`${item.count} courses`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Languages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Languages
              </Typography>
              <List>
                {data?.coursesByLanguage?.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={item._id}
                      secondary={`${item.count} courses`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Categories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Categories
              </Typography>
              <List>
                {data?.coursesByCategory?.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={item._id || 'Uncategorized'}
                      secondary={`${item.count} courses`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Clusters */}
        {data?.coursesByCluster && data.coursesByCluster.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Clusters (ML)
                </Typography>
                <List>
                  {data.coursesByCluster.map((item) => (
                    <ListItem key={item._id}>
                      <ListItemText
                        primary={`Cluster ${item._id}`}
                        secondary={`${item.count} courses`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default Analytics;

