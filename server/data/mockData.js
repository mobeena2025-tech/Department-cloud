// Realistic academic seed data for Department Academic Cloud
// Designed for Computer Science & Engineering / Artificial Intelligence & Machine Learning

export const mockUsers = [
  {
    id: 'usr_student_1',
    name: 'Demo Student A',
    rollNo: 'DEMO-ROLL',
    email: 'demo.user@example.edu',
    role: 'student',
    department: 'CSE - Artificial Intelligence & Machine Learning',
    semester: 6,
    section: 'A',
    cgpa: 8.92,
    creditsCompleted: 114,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    enrolledCourses: ['AI204', 'CS301', 'CS202', 'AI302'],
    status: 'Actykw ive',
  },
  {
    id: 'usr_student_2',
    name: 'Demo Student B',
    rollNo: 'DEMO-ROLL',
    email: 'demo.user@example.edu',
    role: 'student',
    department: 'CSE - Artificial Intelligence & Machine Learning',
    semester: 6,
    section: 'A',
    cgpa: 9.15,
    creditsCompleted: 114,
    enrolledCourses: ['AI204', 'CS301', 'CS202', 'AI302'],
    status: 'Active',
  },
  {
    id: 'usr_student_3',
    name: 'Demo Student C',
    rollNo: 'DEMO-ROLL',
    email: 'demo.user@example.edu',
    role: 'student',
    department: 'CSE - Artificial Intelligence & Machine Learning',
    semester: 6,
    section: 'A',
    cgpa: 8.45,
    creditsCompleted: 114,
    enrolledCourses: ['AI204', 'CS301', 'CS202', 'AI302'],
    status: 'Active',
  },
  {
    id: 'usr_student_4',
    name: 'Demo Student D',
    rollNo: 'DEMO-ROLL',
    email: 'demo.user@example.edu',
    role: 'student',
    department: 'CSE - Artificial Intelligence & Machine Learning',
    semester: 6,
    section: 'B',
    cgpa: 8.78,
    creditsCompleted: 114,
    enrolledCourses: ['AI204', 'CS301', 'CS202'],
    status: 'Active',
  },
  {
    id: 'usr_faculty_1',
    name: 'Dr. Demo Faculty A',
    empId: 'FAC-AI-104',
    email: 'demo.user@example.edu',
    role: 'faculty',
    department: 'CSE - Artificial Intelligence & Machine Learning',
    designation: 'Associate Professor & Course Lead',
    office: 'Tech Block 3, Room 412',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    coursesTaught: ['AI204', 'AI301'],
    totalStudentsMentored: 138,
    status: 'Active',
  },
  {
    id: 'usr_faculty_2',
    name: 'Dr. Demo Faculty B',
    empId: 'FAC-CS-208',
    email: 'demo.user@example.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    designation: 'Professor',
    office: 'Tech Block 2, Room 205',
    coursesTaught: ['CS301'],
    totalStudentsMentored: 142,
    status: 'Active',
  },
  {
    id: 'usr_admin_1',
    name: 'Prof. Demo Head',
    empId: 'HOD-CSE-001',
    email: 'demo.user@example.edu',
    role: 'admin',
    department: 'Computer Science & Engineering / AI&ML',
    designation: 'Professor & Head of Department',
    office: 'Central Administrative Wing, HOD Secretariat',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
  },
];

export const mockCourses = [
  {
    id: 'AI204',
    code: 'AI204',
    title: 'Artificial Neural Networks',
    department: 'CSE - AI & ML',
    semester: 6,
    credits: 4,
    facultyId: 'usr_faculty_1',
    facultyName: 'Dr. Demo Faculty A',
    description: 'Foundational and advanced principles of biological & artificial neurons, deep feedforward networks, optimization, convolutional networks, and recurrent architectures with tensor implementations.',
    syllabusUrl: '/docs/AI204_Syllabus_2026.pdf',
    enrolledCount: 68,
    unitsCount: 5,
    materialsCount: 22,
    activeAssignmentsCount: 2,
    units: [
      {
        unitNumber: 1,
        title: 'Introduction to Neural Networks & Perceptrons',
        description: 'Biological inspiration, McCulloch-Pitts model, single-layer perceptron, linearly separable patterns, and activation functions (Sigmoid, Tanh, ReLU, Leaky ReLU).',
      },
      {
        unitNumber: 2,
        title: 'Deep Neural Networks & Backpropagation',
        description: 'Multi-layer perceptrons, forward propagation, derivation of backpropagation algorithm, loss functions, vanishing/exploding gradient problems, and modern optimizers (SGD, Momentum, Adam).',
      },
      {
        unitNumber: 3,
        title: 'Convolutional Neural Networks (CNN)',
        description: 'Convolution operations, kernels, stride and padding, pooling layers (Max, Average, Global), receptive fields, LeNet, AlexNet, VGG, ResNet skip connections.',
      },
      {
        unitNumber: 4,
        title: 'Recurrent Neural Networks & Sequence Modeling',
        description: 'Sequential data processing, Elman RNNs, backpropagation through time (BPTT), vanishing gradients in sequences, Long Short-Term Memory (LSTM) gates, and GRUs.',
      },
      {
        unitNumber: 5,
        title: 'Autoencoders & Modern Architectural Advances',
        description: 'Undercomplete and regularized autoencoders, representation learning, latent spaces, introductory attention mechanisms, and transfer learning workflows.',
      },
    ],
  },
  {
    id: 'CS301',
    code: 'CS301',
    title: 'Computer Networks',
    department: 'Computer Science & Engineering',
    semester: 6,
    credits: 3,
    facultyId: 'usr_faculty_2',
    facultyName: 'Dr. Demo Faculty B',
    description: 'Architectural layered reference models (OSI and TCP/IP), network layer routing protocols, reliable transport mechanisms, congestion control, and application services.',
    syllabusUrl: '/docs/CS301_Syllabus_2026.pdf',
    enrolledCount: 72,
    unitsCount: 5,
    materialsCount: 18,
    activeAssignmentsCount: 1,
    units: [
      { unitNumber: 1, title: 'Physical & Data Link Layers', description: 'Transmission media, framing, error detection (CRC), flow control, and sliding window protocols.' },
      { unitNumber: 2, title: 'Network Layer & Routing Protocols', description: 'IPv4/IPv6 addressing, subnetting, CIDR, Distance Vector Routing (RIP), and Link State Routing (OSPF).' },
      { unitNumber: 3, title: 'Transport Layer Protocols', description: 'UDP datagram services, TCP connection management (3-way handshake), segment formatting, and reliable stream delivery.' },
      { unitNumber: 4, title: 'Congestion Control & QoS', description: 'TCP Tahoe, Reno, slow start, congestion avoidance, fast retransmit, and token bucket traffic shaping.' },
      { unitNumber: 5, title: 'Application Layer Services & Security', description: 'DNS architecture, HTTP/2 & HTTP/3, SMTP, TLS/SSL cryptographic handshakes, and firewall mechanisms.' },
    ],
  },
  {
    id: 'CS202',
    code: 'CS202',
    title: 'Database Management Systems',
    department: 'Computer Science & Engineering',
    semester: 6,
    credits: 4,
    facultyId: 'usr_faculty_3',
    facultyName: 'Dr. Demo Faculty C',
    description: 'Relational algebra, ER modeling, SQL querying, normal forms (1NF through BCNF), indexing structures (B+ trees, hashing), and ACID transaction management.',
    syllabusUrl: '/docs/CS202_Syllabus_2026.pdf',
    enrolledCount: 70,
    unitsCount: 5,
    materialsCount: 20,
    activeAssignmentsCount: 1,
    units: [
      { unitNumber: 1, title: 'Relational Model & Conceptual Design', description: 'Entity-Relationship (ER) to relational schema mapping, relational constraints, and domain relational calculus.' },
      { unitNumber: 2, title: 'SQL & Advanced Relational Operations', description: 'DDL, DML, complex joins, nested subqueries, CTEs, window functions, and views.' },
      { unitNumber: 3, title: 'Schema Refinement & Normalization', description: 'Functional dependencies, Armstrong axioms, 1NF, 2NF, 3NF, BCNF decomposition, and lossless join verification.' },
      { unitNumber: 4, title: 'Transaction Processing & Concurrency', description: 'ACID properties, serializability graphs, two-phase locking (2PL), deadlock handling, and WAL logging.' },
      { unitNumber: 5, title: 'Physical Storage & Query Optimization', description: 'RAID levels, B+ Tree indexing, cost-based query evaluation plans, and join algorithm optimizations.' },
    ],
  },
  {
    id: 'AI302',
    code: 'AI302',
    title: 'Data Science',
    department: 'CSE - AI & ML',
    semester: 6,
    credits: 3,
    facultyId: 'usr_faculty_4',
    facultyName: 'Dr. Demo Faculty D',
    description: 'Data wrangling, statistical inference, feature engineering, predictive supervised and unsupervised models, and big data visualization paradigms.',
    syllabusUrl: '/docs/AI302_Syllabus_2026.pdf',
    enrolledCount: 65,
    unitsCount: 5,
    materialsCount: 16,
    activeAssignmentsCount: 1,
    units: [
      { unitNumber: 1, title: 'Statistical Foundations for Data Science', description: 'Probability distributions, central limit theorem, hypothesis testing (p-values, t-tests, ANOVA).' },
      { unitNumber: 2, title: 'Data Ingestion & Wrangling', description: 'Tidy data, handling missing values, outlier detection, scaling, and categorical encoding with Pandas/NumPy.' },
      { unitNumber: 3, title: 'Supervised Learning & Regression', description: 'Linear, ridge, lasso regression, classification trees, random forests, and gradient boosting machines.' },
      { unitNumber: 4, title: 'Unsupervised Analysis & Clustering', description: 'K-means, hierarchical clustering, DBSCAN, and dimensionality reduction via PCA and t-SNE.' },
      { unitNumber: 5, title: 'Model Evaluation, Explainability & Ethics', description: 'Confusion matrices, ROC-AUC curves, SHAP value interpretations, and algorithmic fairness.' },
    ],
  },
];

export const mockMaterials = [
  // AI204 Unit 1
  {
    id: 'mat_ai204_01',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 1,
    unitTitle: 'Unit 1: Introduction to Neural Networks',
    title: 'Introduction to Neural Networks.pdf',
    topic: 'Biological vs Artificial Neurons & Activation Functions',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '4.8 MB',
    pages: 38,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-08-10',
    downloads: 142,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit1/intro_neural_networks.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['perceptron', 'biological neuron', 'activation functions', 'sigmoid', 'relu'],
    summary: 'Comprehensive introductory notes covering the transition from biological dendritic signaling to the mathematical McCulloch-Pitts neuron. Detail on step, sigmoid, tanh, and ReLU activations with comparative convergence profiles.',
    contentPreview: `DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
COURSE: AI204 - ARTIFICIAL NEURAL NETWORKS (UNIT 1)
FACULTY: DR. DEMO FACULTY A

1.1 BIOLOGICAL INSPIRATION
Biological neural networks consist of interconnected neurons that transmit electrochemical signals. The dendrites receive inputs from upstream synapses, the cell body (soma) integrates the incoming signals, and if the net potential exceeds a threshold, an action potential is fired down the axon.

1.2 ARTIFICIAL PERCEPTRON MATHEMATICAL MODEL
For input vector X = [x1, x2, ..., xn]^T and weight vector W = [w1, w2, ..., wn]^T:
Net activation z = sum(wi * xi) + b = W^T * X + b
Output y = f(z), where f is the non-linear activation function.

1.3 COMMON ACTIVATION FUNCTIONS:
- Sigmoid: f(z) = 1 / (1 + e^-z). Output range (0, 1). Susceptible to vanishing gradient at saturation tails.
- Hyperbolic Tangent (Tanh): f(z) = (e^z - e^-z) / (e^z + e^-z). Zero-centered, range (-1, 1).
- Rectified Linear Unit (ReLU): f(z) = max(0, z). Constant derivative 1 for z > 0, mitigating gradient decay in deep layers.`,
  },
  {
    id: 'mat_ai204_02',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 1,
    unitTitle: 'Unit 1: Introduction to Neural Networks',
    title: 'Perceptron and Activation Functions.pptx',
    topic: 'Perceptron Convergence Theorem & Linearly Separable Decision Boundaries',
    fileType: 'PPTX',
    materialType: 'PPT Presentation',
    size: '12.4 MB',
    pages: 45,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-08-14',
    downloads: 118,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit1/perceptron_activation.pptx',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['linear separability', 'xor problem', 'minsky papert', 'perceptron convergence'],
    summary: 'Classroom slide deck detailing Rosenblatt perceptron learning algorithm, geometric hyperplanes, and the classical Minsky-Papert XOR limitation demonstrating the necessity for multi-layer architectures.',
    contentPreview: `SLIDE 1: AI204 Unit 1 - Perceptron Geometric Interpretation
Hyperplane: w1*x1 + w2*x2 + b = 0
The decision boundary separates the feature space into two half-spaces.

SLIDE 8: The XOR Dilemma
A single hyperplane cannot separate (0,0) and (1,1) from (0,1) and (1,0). This proof by Minsky & Papert (1969) motivated the design of hidden representation layers.`,
  },
  // AI204 Unit 2
  {
    id: 'mat_ai204_03',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Deep Neural Networks & Backpropagation',
    title: 'Deep Neural Networks.pdf',
    topic: 'Multi-layer Perceptrons & Forward Propagation Mechanics',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '6.2 MB',
    pages: 52,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-08-22',
    downloads: 189,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit2/deep_neural_networks.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['deep networks', 'forward pass', 'matrix formulation', 'hidden layers'],
    summary: 'Vectorized tensor representations of deep feedforward networks, layer-by-layer affine transformations, computational graphs, and loss function landscapes (MSE, Cross-Entropy).',
    contentPreview: `DEPARTMENT OF AI & ML — AI204 (UNIT 2)
FORWARD PROPAGATION IN MATRIX FORM:
Let a^[l] denote the activation vector of layer l.
z^[l] = W^[l] * a^[l-1] + b^[l]
a^[l] = g^[l](z^[l])

For a network of L layers:
Loss L(y_hat, y) = -sum(y_i * log(y_hat_i)) [Categorical Cross-Entropy]`,
  },
  {
    id: 'mat_ai204_04',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Deep Neural Networks & Backpropagation',
    title: 'Backpropagation Notes.pdf',
    topic: 'Chain Rule Derivation, Gradient Flow & Vanishing Gradient Solutions',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '5.1 MB',
    pages: 42,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-08-28',
    downloads: 234,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit2/backpropagation_notes.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['backpropagation', 'chain rule', 'gradient descent', 'vanishing gradient', 'adam optimizer'],
    summary: 'Rigorous mathematical derivation of the backpropagation algorithm using the multivariate chain rule. Explains loss sensitivity calculations, weight updates, vanishing/exploding gradients, and modern adaptive optimizers like Adam and RMSprop.',
    contentPreview: `DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
AI204: BACKPROPAGATION ALGORITHM & OPTIMIZATION NOTES (UNIT 2)
AUTHOR: DR. DEMO FACULTY A

1. MATHEMATICAL DERIVATION:
Backpropagation is an optimization procedure used to calculate gradients of the loss function with respect to neural-network parameters via the chain rule of calculus.

Let delta^[l] = dLoss / dz^[l].
For the output layer L:
delta^[L] = nabla_a L * g'^[L](z^[L])

For hidden layer l (l = L-1 down to 1):
delta^[l] = ((W^[l+1])^T * delta^[l+1]) element-wise-multiply g'^[l](z^[l])

Gradient with respect to weights:
dLoss / dW^[l] = delta^[l] * (a^[l-1])^T
dLoss / db^[l] = delta^[l]

2. THE VANISHING GRADIENT PROBLEM:
When using saturating activation functions like Sigmoid, the maximum derivative is 0.25. Multiplying many fractions across deep layers causes the gradient to shrink exponentially toward zero, halting learning in early layers.
Solutions:
1. Use non-saturating activations (ReLU, Leaky ReLU, ELU).
2. He or Xavier/Glorot weight initializations.
3. Residual skip connections (ResNet).
4. Batch Normalization.`,
  },
  // AI204 Unit 3
  {
    id: 'mat_ai204_05',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 3,
    unitTitle: 'Unit 3: Convolutional Neural Networks',
    title: 'CNN Architecture.pdf',
    topic: 'Convolution Operations, Feature Maps, Stride & Padding',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '8.7 MB',
    pages: 60,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-09-02',
    downloads: 215,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit3/cnn_architecture.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['cnn', 'convolution', 'feature maps', 'receptive field', 'filters', 'resnet'],
    summary: 'In-depth treatment of 2D convolutional layers, kernel operations, parameter sharing, translation invariance, receptive field computation, and landmark architectures (AlexNet to ResNet-50).',
    contentPreview: `AI204 — UNIT 3: CONVOLUTIONAL NEURAL NETWORKS
1. CONVOLUTION OPERATION
Given an image I of dimension (H x W x C) and a kernel K of size (k_h x k_w x C):
Feature Map S(i, j) = sum_m sum_n sum_c I(i + m, j + n, c) * K(m, n, c)

Key properties:
- Parameter Sharing: The same filter weights slide across the entire spatial grid, drastically reducing the number of free parameters compared to dense layers.
- Translation Equivariance: Shifting an object in the input produces a corresponding spatial shift in the feature map.`,
  },
  {
    id: 'mat_ai204_06',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 3,
    unitTitle: 'Unit 3: Convolutional Neural Networks',
    title: 'Pooling and Feature Extraction.pdf',
    topic: 'Spatial Downsampling, Max Pooling vs Average Pooling & Receptive Field',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '4.2 MB',
    pages: 31,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-09-06',
    downloads: 168,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit3/pooling_feature_extraction.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['pooling', 'max pooling', 'average pooling', 'feature extraction', 'spatial downsampling'],
    summary: 'Detailed explanation of pooling layers in CNNs. Covers spatial dimension reduction, translation invariance preservation, max pooling vs average pooling mechanisms, and receptive field expansion.',
    contentPreview: `AI204 — UNIT 3: POOLING AND FEATURE EXTRACTION
FACULTY: DR. DEMO FACULTY A

1. PURPOSE OF POOLING:
Pooling layers downsample the spatial dimensions (height and width) of the intermediate feature maps, reducing the computational budget and memory footprint while providing a degree of rotational and positional invariance.

2. MAX POOLING:
Extracts the maximum activation within each non-overlapping or overlapping window:
P(i, j) = max_{m, n in window} F(i*s + m, j*s + n)
Max pooling acts as a detector of dominant features (e.g. sharp edges, prominent texture cues) regardless of minor spatial shifts.

3. AVERAGE POOLING:
Computes the mean activation across the window. Often utilized in Global Average Pooling (GAP) prior to classification heads to replace dense flattening layers and prevent overfitting.`,
  },
  // CS301 Materials
  {
    id: 'mat_cs301_01',
    courseId: 'CS301',
    courseName: 'Computer Networks',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Network Layer & Routing Protocols',
    title: 'Routing Algorithms — CN.pdf',
    topic: 'Distance Vector Routing vs Link State Routing (RIP & OSPF)',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '7.3 MB',
    pages: 48,
    uploadedBy: 'Dr. Demo Faculty B',
    uploadDate: '2026-08-18',
    downloads: 195,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse/sem6/cs301/unit2/routing_algorithms.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['routing', 'dijkstra', 'bellman-ford', 'ospf', 'rip', 'distance vector'],
    summary: 'Comparative analysis of intra-AS routing protocols. Details Bellman-Ford algorithm in RIP, count-to-infinity problem, split horizon heuristics, and Dijkstra shortest-path computation in OSPF.',
    contentPreview: `CS301 — COMPUTER NETWORKS (UNIT 2)
ROUTING ALGORITHMS & PROTOCOLS
1. LINK STATE ROUTING (OSPF):
Each node floods link-state advertisements (LSAs) containing its immediate neighbors and edge costs. Every node reconstructs the full network topology graph and runs Dijkstra algorithm to compute the shortest-path tree rooted at itself.
Complexity: O(|E| + |V| log |V|) with Fibonacci heap.

2. DISTANCE VECTOR ROUTING (RIP):
Nodes iteratively exchange routing vectors with directly adjacent neighbors using Bellman-Ford equation:
d_x(y) = min_v { c(x, v) + d_v(y) }
Prone to count-to-infinity loop conditions. Mitigated via Poison Reverse and Split Horizon techniques.`,
  },
  {
    id: 'mat_cs301_02',
    courseId: 'CS301',
    courseName: 'Computer Networks',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Network Layer & Routing Protocols',
    title: 'Packet Tracer Lab 3 Manual - OSPF Configuration.pdf',
    topic: 'Cisco Packet Tracer Multi-Area OSPF Configuration Lab',
    fileType: 'PDF',
    materialType: 'Lab Material',
    size: '5.6 MB',
    pages: 22,
    uploadedBy: 'Dr. Demo Faculty B',
    uploadDate: '2026-08-20',
    downloads: 174,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse/sem6/cs301/unit2/packet_tracer_lab3_manual.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['packet tracer', 'lab manual', 'ospf', 'cisco', 'topology'],
    summary: 'Laboratory manual detailing the step-by-step procedure to configure autonomous systems and multi-area OSPF routing in Cisco Packet Tracer.',
    contentPreview: `CS301 — LAB MANUAL: CISCO PACKET TRACER (UNIT 2)
EXPERIMENT 3: CONFIGURATION OF MULTI-AREA OSPF
1. Objectives:
- Configure router interfaces with appropriate IPv4 CIDR blocks.
- Enable OSPF process ID 1 and announce participating subnets with wildcard masks.
- Verify routing tables using 'show ip route' and 'show ip ospf neighbor'.`,
  },
  // CS202 Materials
  {
    id: 'mat_cs202_01',
    courseId: 'CS202',
    courseName: 'Database Management Systems',
    semester: 6,
    unitNumber: 5,
    unitTitle: 'Unit 5: Physical Storage & Query Optimization',
    title: 'SQL Optimization — DBMS.pdf',
    topic: 'Cost-Based Optimizer, B+ Tree Indexing & Join Algorithms',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '6.5 MB',
    pages: 54,
    uploadedBy: 'Dr. Demo Faculty C',
    uploadDate: '2026-08-25',
    downloads: 210,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse/sem6/cs202/unit5/sql_optimization_dbms.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['sql optimization', 'b+ tree', 'hash join', 'nested loop', 'execution plan'],
    summary: 'Physical database internals covering clustered vs non-clustered B+ tree indices, disk block I/O minimization, relational algebra equivalence rewrites, and cost estimation formulas for Hash Join vs Sort-Merge Join.',
    contentPreview: `CS202 — DATABASE MANAGEMENT SYSTEMS (UNIT 5)
QUERY EVALUATION & PHYSICAL OPTIMIZATION
1. B+ TREE INDEX STRUCTURE:
Balanced search tree where all data pointers reside strictly in leaf nodes linked sequentially for rapid range scans. Interior nodes act purely as navigational routers. Height remains low (log_B N), guaranteeing 3-4 disk I/Os for multimillion-row tables.

2. JOIN ALGORITHMS COMPARISON:
- Block Nested Loop Join: O(B_R + (B_R / (M-2)) * B_S)
- Sort-Merge Join: Efficient when relations are already sorted on join attributes or indexed.
- Grace Hash Join: Partitions both relations into buckets using hash function h1, reads each bucket pair into memory for matching. Optimal for large equijoins.`,
  },
  {
    id: 'mat_cs202_02',
    courseId: 'CS202',
    courseName: 'Database Management Systems',
    semester: 6,
    unitNumber: 3,
    unitTitle: 'Unit 3: Schema Refinement & Normalization',
    title: 'DBMS Unit 3 - Normalization & BCNF Notes.pdf',
    topic: 'Functional Dependencies, 1NF to BCNF & Lossless Decomposition',
    fileType: 'PDF',
    materialType: 'PDF Notes',
    size: '5.8 MB',
    pages: 46,
    uploadedBy: 'Dr. Demo Faculty C',
    uploadDate: '2026-08-30',
    downloads: 248,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse/sem6/cs202/unit3/normalization_bcnf_notes.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['normalization', 'functional dependency', 'bcnf', '3nf', 'lossless join', 'dependency preservation'],
    summary: 'Comprehensive notes for DBMS Unit 3. Covers functional dependency closures, Armstrong axioms, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), and algorithms for testing lossless-join decomposition.',
    contentPreview: `CS202 — DATABASE MANAGEMENT SYSTEMS (UNIT 3)
SCHEMA REFINEMENT & FUNCTIONAL DEPENDENCIES
FACULTY: DR. DEMO FACULTY C

1. FUNCTIONAL DEPENDENCY (FD):
Given relation R, an FD X -> Y holds over R if for every valid instance r(R), whenever two tuples agree on attribute set X, they must also agree on attribute set Y.

2. NORMAL FORMS:
- 1NF: Attribute values must be atomic. No repeating groups.
- 2NF: In 1NF and no non-prime attribute is partially dependent on any candidate key.
- 3NF: In 2NF and for every non-trivial FD X -> A, either X is a superkey or A is a prime attribute.
- BCNF: For every non-trivial FD X -> A, X must strictly be a superkey. Eliminates all redundancy based on functional dependencies.`,
  },
  {
    id: 'mat_cs202_03',
    courseId: 'CS202',
    courseName: 'Database Management Systems',
    semester: 6,
    unitNumber: 3,
    unitTitle: 'Unit 3: Schema Refinement & Normalization',
    title: 'DBMS Previous Mid-Term Question Paper.pdf',
    topic: 'Mid-Term 1 & 2 Question Bank with Solutions for Normalization',
    fileType: 'PDF',
    materialType: 'Question Paper',
    size: '2.4 MB',
    pages: 14,
    uploadedBy: 'Dr. Demo Faculty C',
    uploadDate: '2026-09-04',
    downloads: 312,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse/sem6/cs202/unit3/midterm_question_paper_dbms.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['question paper', 'previous exams', 'midterm', 'practice problems', 'bcnf'],
    summary: 'Official compiled department question paper containing numerical problems on finding candidate keys, attribute closures (F+), testing whether a decomposition is in 3NF or BCNF, and calculating canonical covers.',
    contentPreview: `CHAITANYA BHARATHI INSTITUTE OF TECHNOLOGY (AUTONOMOUS)
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
MID-SEMESTER ASSESSMENT QUESTION BANK: CS202 DATABASE SYSTEMS
PART A (Short Answer):
1. State Armstrong's Axioms for functional dependencies.
2. Differentiate between BCNF and 3NF with a minimal counterexample.
PART B:
3. Let R = (A, B, C, D, E) with F = {A -> BC, CD -> E, B -> D, E -> A}. Find all candidate keys of R.`,
  },
  // AI302 Materials
  {
    id: 'mat_ai302_01',
    courseId: 'AI302',
    courseName: 'Data Science',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Data Ingestion & Wrangling',
    title: 'Exploratory Data Analysis in Python.ipynb',
    topic: 'Data Cleaning, Imputation & Feature Scaling in Pandas/Scikit-Learn',
    fileType: 'IPYNB',
    materialType: 'Lab Material',
    size: '3.1 MB',
    pages: 28,
    uploadedBy: 'Dr. Demo Faculty D',
    uploadDate: '2026-09-01',
    downloads: 145,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai302/unit2/eda_python_lab.ipynb',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['python', 'pandas', 'eda', 'feature engineering', 'scikit-learn'],
    summary: 'Interactive Jupyter notebook demonstrating multivariate statistical inspection, missing value imputation strategies (IterativeImputer vs Median), RobustScaler vs StandardScaler comparisons, and correlation matrices.',
    contentPreview: `JUPYTER NOTEBOOK — AI302 UNIT 2 LAB DEMO
import pandas as pd
import numpy as np
import seaborn as sns

# Load departmental benchmark dataset
df = pd.read_csv('academic_performance_data.csv')
print(df.info())

# Inspection of missing attributes & skewness
skew_factors = df.select_dtypes(include=[np.number]).skew()
print("Skewness metrics:\n", skew_factors)`,
  },
  // Reference Document
  {
    id: 'mat_ai204_07',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    semester: 6,
    unitNumber: 2,
    unitTitle: 'Unit 2: Deep Neural Networks & Backpropagation',
    title: 'Deep Learning Review - LeCun, Bengio, Hinton (Nature).pdf',
    topic: 'Landmark Survey of Deep Architectures & Gradient Backpropagation',
    fileType: 'PDF',
    materialType: 'Reference Document',
    size: '3.9 MB',
    pages: 14,
    uploadedBy: 'Dr. Demo Faculty A',
    uploadDate: '2026-08-15',
    downloads: 182,
    visibility: 'Department / Enrolled',
    accessPermissions: 'Enrolled Students & Faculty',
    downloadPermitted: true,
    storageKey: 's3://cbit-academic-cloud/cse-aiml/sem6/ai204/unit2/nature_deep_learning_review.pdf',
    storageStatus: 'Simulated Private Object Storage',
    tags: ['reference document', 'deep learning', 'nature paper', 'backpropagation survey'],
    summary: 'Foundational review paper by Yann LeCun, Yoshua Bengio, and Geoffrey Hinton published in Nature (2015). Provides historical and theoretical overview of gradient learning, convolutional networks, and distributed representations.',
    contentPreview: `NATURE VOL 521 | 28 MAY 2015 | REVIEW
DEEP LEARNING — YANN LECUN, YOSHUA BENGIO & GEOFFREY HINTON

Abstract: Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction. These methods have dramatically improved the state-of-the-art in speech recognition, visual object recognition, object detection and many other domains such as drug discovery and genomics.`,
  },
];

export const mockAssignments = [
  {
    id: 'asg_ann_02',
    courseId: 'AI204',
    courseCode: 'AI204',
    courseTitle: 'Artificial Neural Networks',
    title: 'ANN Assignment 2: Backpropagation Implementation',
    description: 'Implement a multi-layer perceptron from scratch in NumPy without relying on PyTorch or TensorFlow autograd. Derive the backward pass gradients manually, verify with numerical gradient checking, and train on the Fashion-MNIST dataset.',
    unitNumber: 2,
    assignedDate: '2026-09-05',
    dueDate: '2026-09-20T23:59:00',
    maxMarks: 25,
    facultyId: 'usr_faculty_1',
    facultyName: 'Dr. Demo Faculty A',
    attachmentName: 'ANN_Assignment2_Specification.pdf',
    attachmentSize: '1.2 MB',
    totalEnrolled: 68,
    submittedCount: 46,
    pendingCount: 22,
    status: 'Active',
  },
  {
    id: 'asg_cn_01',
    courseId: 'CS301',
    courseCode: 'CS301',
    courseTitle: 'Computer Networks',
    title: 'CN Quiz & Cisco Packet Tracer Lab 3',
    description: 'Configure multi-area OSPF routing across three autonomous router clusters in Cisco Packet Tracer. Document routing convergence times, verify LSA flooding behavior, and complete the associated 20-question online diagnostic quiz.',
    unitNumber: 2,
    assignedDate: '2026-09-08',
    dueDate: '2026-09-22T18:00:00',
    maxMarks: 20,
    facultyId: 'usr_faculty_2',
    facultyName: 'Dr. Demo Faculty B',
    attachmentName: 'PacketTracer_Topology_Lab3.pkt',
    attachmentSize: '4.8 MB',
    totalEnrolled: 72,
    submittedCount: 58,
    pendingCount: 14,
    status: 'Active',
  },
  {
    id: 'asg_dbms_01',
    courseId: 'CS202',
    courseCode: 'CS202',
    courseTitle: 'Database Management Systems',
    title: 'DBMS Assignment: B+ Tree & Index Optimization',
    description: 'Analyze an unindexed million-row relational schema in PostgreSQL. Write EXPLAIN ANALYZE queries, identify sequential scans, design composite B+ Tree and Partial indices, and produce a comparative benchmark report demonstrating query cost reductions.',
    unitNumber: 5,
    assignedDate: '2026-09-10',
    dueDate: '2026-09-25T23:59:00',
    maxMarks: 30,
    facultyId: 'usr_faculty_3',
    facultyName: 'Dr. Demo Faculty C',
    attachmentName: 'DBMS_Indexing_Benchmark_Dataset.sql',
    attachmentSize: '8.4 MB',
    totalEnrolled: 70,
    submittedCount: 32,
    pendingCount: 38,
    status: 'Active',
  },
];

export const mockSubmissions = [
  {
    id: 'sub_ann_001',
    assignmentId: 'asg_ann_02',
    courseId: 'AI204',
    studentId: 'usr_student_1',
    studentName: 'Demo Student A',
    rollNo: 'DEMO-ROLL',
    submittedAt: '2026-09-13T16:42:00',
    status: 'Submitted',
    fileName: 'ANN_Assignment2_DEMO-ROLL.pdf',
    fileSize: '3.4 MB',
    submissionText: 'Implemented MLP from scratch using NumPy with Adam optimizer and numerical gradient verification (relative error < 1e-7). Fashion-MNIST validation accuracy achieved 88.4%.',
    grade: null,
    maxMarks: 25,
    feedback: null,
    gradedBy: null,
    gradedAt: null,
  },
  {
    id: 'sub_ann_002',
    assignmentId: 'asg_ann_02',
    courseId: 'AI204',
    studentId: 'usr_student_2',
    studentName: 'Demo Student B',
    rollNo: 'DEMO-ROLL',
    submittedAt: null,
    status: 'Pending',
    fileName: null,
    fileSize: null,
    submissionText: null,
    grade: null,
    maxMarks: 25,
    feedback: null,
  },
  {
    id: 'sub_ann_003',
    assignmentId: 'asg_ann_02',
    courseId: 'AI204',
    studentId: 'usr_student_3',
    studentName: 'Demo Student C',
    rollNo: 'DEMO-ROLL',
    submittedAt: '2026-09-14T09:15:00',
    status: 'Graded',
    fileName: 'ANN2_StudentC_DEMO-ROLL.zip',
    fileSize: '5.1 MB',
    submissionText: 'NumPy vectorized implementation with He-initialization and cross-entropy loss tracking graphs.',
    grade: 24,
    maxMarks: 25,
    feedback: 'Exceptional mathematical derivation of gradient tensor backpropagation. Clean modular code structure.',
    gradedBy: 'Dr. Demo Faculty A',
    gradedAt: '2026-09-14T10:30:00',
  },
  {
    id: 'sub_ann_004',
    assignmentId: 'asg_ann_02',
    courseId: 'AI204',
    studentId: 'usr_student_4',
    studentName: 'Demo Student D',
    rollNo: 'DEMO-ROLL',
    submittedAt: '2026-09-12T14:20:00',
    status: 'Submitted',
    fileName: 'ANN2_StudentD_DEMO-ROLL.pdf',
    fileSize: '2.8 MB',
    submissionText: 'Completed forward and backward propagation routines with mini-batch stochastic gradient descent.',
    grade: null,
    maxMarks: 25,
    feedback: null,
  },
];

export const mockAnnouncements = [
  {
    id: 'anc_01',
    title: 'Mid-Semester Examination Schedule & Internal Assessment Guidelines',
    category: 'Department General',
    priority: 'Urgent',
    department: 'CSE / AI & ML',
    courseId: null,
    author: 'Prof. Demo Head (HOD)',
    date: '2026-09-12T10:00:00',
    content: 'The Mid-Semester Internal Assessment Examinations for B.E. 6th Semester will commence from October 6, 2026. Students are advised to ensure that all pending assignment submissions across courses are resolved prior to September 30. Detailed timetable is published in the Academic Notice section.',
    attachments: [{ name: 'MidSem_TimeTable_BTech_6thSem.pdf', size: '420 KB' }],
  },
  {
    id: 'anc_02',
    title: 'AI204: Guest Lecture on Transformer Attention & LLM Pre-training',
    category: 'Course Notice',
    priority: 'High',
    department: 'CSE - AI & ML',
    courseId: 'AI204',
    courseName: 'Artificial Neural Networks',
    author: 'Dr. Demo Faculty A',
    date: '2026-09-13T14:30:00',
    content: 'We are hosting Dr. Demo Guest Speaker, Principal AI Scientist at Google DeepMind India, for a specialized seminar on "Scaling Laws in Self-Attention Architectures" this Friday at 3:00 PM in Seminar Hall 2. Attendance is mandatory for all students enrolled in AI204.',
    attachments: [{ name: 'Seminar_Abstract_Guest.pdf', size: '210 KB' }],
  },
  {
    id: 'anc_03',
    title: 'Department Cloud Infrastructure Maintenance Window',
    category: 'System & Security',
    priority: 'Normal',
    department: 'CSE / AI & ML',
    courseId: null,
    author: 'Cloud Infrastructure Administrator',
    date: '2026-09-11T18:00:00',
    content: 'Routine security indexing and vector cache optimization will take place on Saturday midnight between 02:00 AM and 03:00 AM. Cloud document retrieval and upload capabilities will remain functional without downtime.',
    attachments: [],
  },
  {
    id: 'anc_04',
    title: 'CS301: Packet Tracer Lab 3 Submission Window Open',
    category: 'Course Notice',
    priority: 'Normal',
    department: 'Computer Science & Engineering',
    courseId: 'CS301',
    courseName: 'Computer Networks',
    author: 'Dr. Demo Faculty B',
    date: '2026-09-09T11:15:00',
    content: 'The Cisco Packet Tracer simulation topology file for OSPF multi-area routing is now accessible under Course Materials -> Unit 2. Complete both topology configuration and questions by the deadline.',
    attachments: [],
  },
];

export const mockAuditLogs = [
  {
    id: 'log_01',
    timestamp: '2026-09-14T10:42:15',
    actorName: 'Dr. Demo Faculty A',
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'UPLOAD_MATERIAL',
    resource: 'Pooling and Feature Extraction.pdf (AI204 - Unit 3)',
    ipAddress: '10.20.44.112',
    status: 'SUCCESS',
    severity: 'INFO',
    details: 'Uploaded 4.2 MB document to department storage. AI classification auto-tagged Unit 3.',
  },
  {
    id: 'log_02',
    timestamp: '2026-09-14T10:38:40',
    actorName: 'Demo Student A',
    actorRole: 'student',
    actorEmail: 'demo.user@example.edu',
    action: 'ACCESS_DOCUMENT',
    resource: 'CNN Architecture.pdf (AI204)',
    ipAddress: '10.20.108.45',
    status: 'SUCCESS',
    severity: 'INFO',
    details: 'Cloud document preview rendered with valid enrolled token.',
  },
  {
    id: 'log_03',
    timestamp: '2026-09-14T10:30:12',
    actorName: 'Dr. Demo Faculty A',
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'GRADE_SUBMISSION',
    resource: 'ANN Assignment 2 (Student: Demo Student C - DEMO-ROLL)',
    ipAddress: '10.20.44.112',
    status: 'SUCCESS',
    severity: 'INFO',
    details: 'Awarded 24/25 marks with qualitative feedback.',
  },
  {
    id: 'log_04',
    timestamp: '2026-09-14T10:21:05',
    actorName: 'Prof. Demo Head',
    actorRole: 'admin',
    actorEmail: 'demo.user@example.edu',
    action: 'SYSTEM_AUDIT_INSPECTION',
    resource: 'Department Security Logs & Analytics Registry',
    ipAddress: '10.20.2.1',
    status: 'SUCCESS',
    severity: 'LOW',
    details: 'Executive review of faculty and student cloud activity metrics.',
  },
  {
    id: 'log_05',
    timestamp: '2026-09-14T09:54:20',
    actorName: 'Dr. Demo Faculty A',
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'POST_ANNOUNCEMENT',
    resource: 'AI204: Guest Lecture on Transformer Attention',
    ipAddress: '10.20.44.112',
    status: 'SUCCESS',
    severity: 'INFO',
    details: 'Published course notice with PDF abstract attachment.',
  },
  {
    id: 'log_06',
    timestamp: '2026-09-14T09:12:33',
    actorName: 'Demo Student A',
    actorRole: 'student',
    actorEmail: 'demo.user@example.edu',
    action: 'UNAUTHORIZED_ACCESS_BLOCKED',
    resource: '/api/admin/gradebook/export',
    ipAddress: '10.20.108.45',
    status: 'DENIED',
    severity: 'WARNING',
    details: 'Route guard intercepted unauthorized attempt to access administrator gradebook endpoint.',
  },
  {
    id: 'log_07',
    timestamp: '2026-09-13T16:42:00',
    actorName: 'Demo Student A',
    actorRole: 'student',
    actorEmail: 'demo.user@example.edu',
    action: 'SUBMIT_ASSIGNMENT',
    resource: 'ANN Assignment 2 (ANN_Assignment2_DEMO-ROLL.pdf)',
    ipAddress: '10.20.108.45',
    status: 'SUCCESS',
    severity: 'INFO',
    details: 'Assignment package uploaded and cryptographically hashed (SHA-256 verified).',
  },
  {
    id: 'log_08',
    timestamp: '2026-09-13T11:05:18',
    actorName: 'Prof. Demo Head',
    actorRole: 'admin',
    actorEmail: 'demo.user@example.edu',
    action: 'UPDATE_STORAGE_QUOTA',
    resource: 'Department Cloud Academic Store: Raised to 500 GB',
    ipAddress: '10.20.2.1',
    status: 'SUCCESS',
    severity: 'LOW',
    details: 'Allocated additional tier capacity for high-resolution datasets and slide decks.',
  },
];

export const mockDepartmentAnalytics = {
  overview: {
    totalStudents: 742,
    totalFaculty: 38,
    totalCourses: 24,
    academicResources: 846,
    storageUsedGb: 184.2,
    storageTotalGb: 500.0,
    assignmentSubmissionRate: 88.4,
    dailyActiveUsers: 612,
  },
  resourceUsageByCourse: [
    { courseCode: 'AI204', courseName: 'Artificial Neural Networks', downloads: 866, uploads: 22, activeUsers: 68 },
    { courseCode: 'CS301', courseName: 'Computer Networks', downloads: 720, uploads: 18, activeUsers: 72 },
    { courseCode: 'CS202', courseName: 'Database Management Systems', downloads: 685, uploads: 20, activeUsers: 70 },
    { courseCode: 'AI302', courseName: 'Data Science', downloads: 540, uploads: 16, activeUsers: 65 },
    { courseCode: 'CS304', courseName: 'Compiler Design', downloads: 410, uploads: 14, activeUsers: 64 },
  ],
  weeklyActivity: [
    { day: 'Mon', downloads: 340, uploads: 12, aiQueries: 198, activeLogins: 580 },
    { day: 'Tue', downloads: 420, uploads: 18, aiQueries: 245, activeLogins: 610 },
    { day: 'Wed', downloads: 510, uploads: 24, aiQueries: 310, activeLogins: 645 },
    { day: 'Thu', downloads: 480, uploads: 15, aiQueries: 280, activeLogins: 620 },
    { day: 'Fri', downloads: 590, uploads: 31, aiQueries: 395, activeLogins: 690 },
    { day: 'Sat', downloads: 260, uploads: 6, aiQueries: 140, activeLogins: 320 },
    { day: 'Sun', downloads: 310, uploads: 8, aiQueries: 175, activeLogins: 390 },
  ],
  submissionRateByAssignment: [
    { name: 'ANN Assignment 1', rate: 97.0 },
    { name: 'ANN Assignment 2', rate: 67.6 },
    { name: 'CN Packet Tracer 1', rate: 94.4 },
    { name: 'CN Quiz 2', rate: 80.5 },
    { name: 'DBMS SQL Benchmark', rate: 45.7 },
  ],
  aiSearchTelemetry: {
    totalQueriesThisMonth: 4290,
    groundingAccuracyRate: 98.2,
    avgResponseLatencyMs: 240,
    topSearchedTopics: [
      { topic: 'Backpropagation & Gradient Descent', count: 684 },
      { topic: 'CNN Pooling & Convolution Kernels', count: 542 },
      { topic: 'B+ Tree Indexing & SQL Tuning', count: 489 },
      { topic: 'Distance Vector vs OSPF Routing', count: 412 },
      { topic: 'Vanishing Gradients & ReLU', count: 378 },
    ],
  },
};
