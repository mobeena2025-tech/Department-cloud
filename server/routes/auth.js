import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Get users for demo login / role selection
router.get('/demo-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role')
      .order('name');

    if (error) {
      console.error('Supabase users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }

    const users = data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      rollNo: u.roll_number,
      semester: u.semester,
      section: u.section,
      cgpa: u.cgpa
    }));

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Demo login
router.post('/login', async (req, res) => {
  try {
    const { role, email, userId } = req.body;

    let query = supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.ilike('email', email);
    } else if (role) {
      query = query.eq('role', role);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Login identifier required'
      });
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      rollNo: data.roll_number,
      semester: data.semester,
      section: data.section,
      cgpa: data.cgpa
    };

    res.json({
      success: true,
      token: `demo_token_${data.id}_${Date.now()}`,
      user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization required'
      });
    }

    // Our demo token contains the UUID after "demo_token_"
    const token = authHeader.replace('Bearer ', '');

    const match = token.match(/^demo_token_(.+)_\d+$/);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const userId = match[1];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      rollNo: data.roll_number,
      semester: data.semester,
      section: data.section,
      cgpa: data.cgpa
    };

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;