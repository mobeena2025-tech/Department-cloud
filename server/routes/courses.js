import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { semester, section } = req.query;

    let query = supabase
      .from('courses')
      .select('*')
      .order('code');

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase courses error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
        error: error.message
      });
    }

    res.json({
      success: true,
      courses: data
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Get a single course
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      course: data
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