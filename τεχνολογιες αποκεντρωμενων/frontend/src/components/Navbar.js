import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

function Navbar() {
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Course Aggregator
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            variant={location.pathname === '/' ? 'outlined' : 'text'}
          >
            Courses
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/analytics"
            variant={location.pathname === '/analytics' ? 'outlined' : 'text'}
          >
            Analytics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

