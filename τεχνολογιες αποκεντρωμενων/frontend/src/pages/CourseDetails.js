import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { coursesAPI } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function CourseDetails() {
  const { id } = useParams();
  const { data: course, isLoading, error } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id)
  );
  const { data: similarData } = useQuery(
    ['similar', id],
    () => coursesAPI.getSimilar(id),
    { enabled: !!course }
  );

  if (isLoading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Course not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={Link}
        to="/"
        sx={{ mb: 2 }}
      >
        Back to Courses
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            {course.title}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Chip label={course.level} color="primary" />
            <Chip label={course.language} />
            <Chip label={course.source.repositoryName} color="secondary" />
            {course.category && <Chip label={course.category} variant="outlined" />}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" paragraph>
            {course.description}
          </Typography>

          {course.keywords && course.keywords.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Keywords
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {course.keywords.map((keyword, index) => (
                  <Chip key={index} label={keyword} size="small" />
                ))}
              </Box>
            </>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Source: {course.source.repositoryName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last Updated: {new Date(course.lastUpdated).toLocaleDateString()}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            href={course.accessLink}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
            sx={{ mt: 3 }}
          >
            Access Course
          </Button>
        </CardContent>
      </Card>

      {similarData?.similarCourses && similarData.similarCourses.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Similar Courses
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {similarData.similarCourses.map((similarCourse) => (
              <Grid item xs={12} sm={6} md={4} key={similarCourse._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {similarCourse.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {similarCourse.shortDescription || similarCourse.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip label={similarCourse.level} size="small" />
                      <Chip label={similarCourse.language} size="small" />
                    </Box>
                    <Button
                      size="small"
                      component={Link}
                      to={`/course/${similarCourse._id}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default CourseDetails;

