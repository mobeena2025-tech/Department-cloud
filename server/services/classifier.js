/**
 * Smart Upload helper: suggests course, unit, topic and tags from simple
 * keywords in the FILE NAME. It does not read the PDF and is not an AI
 * model; faculty should check the suggestion before uploading.
 */
export function classifyUploadedDocument(fileName, fileSize = '5.4 MB') {
  const name = (fileName || '').toLowerCase();

  if (name.includes('cnn') || name.includes('convolution') || name.includes('pooling')) {
    return {
      method: 'filename-keywords',
      fileName,
      fileSize,
      suggestedCourse: 'Artificial Neural Networks',
      suggestedCourseCode: 'AI204',
      suggestedUnit: 'Unit 3: Convolutional Neural Networks',
      unitNumber: 3,
      suggestedTopic: 'Convolutional Neural Networks',
      suggestedType: 'Lecture Material',
      suggestedTags: ['CNN', 'convolution', 'pooling', 'feature extraction'],
    };
  }

  if (name.includes('backprop') || name.includes('gradient') || name.includes('optimizer') || name.includes('deep')) {
    return {
      method: 'filename-keywords',
      fileName,
      fileSize,
      suggestedCourse: 'Artificial Neural Networks',
      suggestedCourseCode: 'AI204',
      suggestedUnit: 'Unit 2: Deep Neural Networks & Backpropagation',
      unitNumber: 2,
      suggestedTopic: 'Deep Feedforward Networks & Backpropagation',
      suggestedType: 'Lecture Notes',
      suggestedTags: ['backpropagation', 'deep learning', 'chain rule', 'gradient descent'],
    };
  }

  if (name.includes('routing') || name.includes('network') || name.includes('packet') || name.includes('ospf') || name.includes('rip')) {
    return {
      method: 'filename-keywords',
      fileName,
      fileSize,
      suggestedCourse: 'Computer Networks',
      suggestedCourseCode: 'CS301',
      suggestedUnit: 'Unit 2: Network Layer & Routing Protocols',
      unitNumber: 2,
      suggestedTopic: 'Network Layer Routing & Topologies',
      suggestedType: 'Lab / Lecture Notes',
      suggestedTags: ['routing', 'ospf', 'distance vector', 'ip addressing'],
    };
  }

  if (name.includes('sql') || name.includes('dbms') || name.includes('database') || name.includes('index') || name.includes('tree')) {
    return {
      method: 'filename-keywords',
      fileName,
      fileSize,
      suggestedCourse: 'Database Management Systems',
      suggestedCourseCode: 'CS202',
      suggestedUnit: 'Unit 5: Physical Storage & Query Optimization',
      unitNumber: 5,
      suggestedTopic: 'B+ Tree Indexing & Query Plans',
      suggestedType: 'Reference Notes',
      suggestedTags: ['sql', 'indexing', 'b+ tree', 'query optimization'],
    };
  }

  // No keyword matched: make no guess, the user fills the form in.
  return {
    method: 'none',
    fileName,
    fileSize,
    suggestedCourse: null,
    suggestedCourseCode: null,
    suggestedUnit: null,
    unitNumber: null,
    suggestedTopic: null,
    suggestedType: null,
    suggestedTags: [],
  };
}
