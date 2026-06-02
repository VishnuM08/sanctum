import { useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Course, Lesson } from '../types/learning';
import {
  BookOpen, Video, FileText, CheckCircle2, Clock,
  Play, PlayCircle, ChevronRight, Award, TrendingUp,
  Code, ExternalLink, Download, ArrowLeft, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

const SAMPLE_COURSES: Course[] = [
  {
    id: '1',
    title: 'JavaScript',
    description: 'JavaScript, often abbreviated as JS, is a programming language and core technology of the web, alongside HTML and CSS. 99% of websites use JavaScript on the client side for webpage behavior.',
    icon: '📜',
    coverImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=300&fit=crop',
    lessons: [
      {
        id: 'l1',
        title: 'Run the live browsers',
        description: 'JavaScript was created for client-side scripts (a script directly embedded in a page).',
        type: 'video',
        duration: 15,
        content: 'Learn how to run JavaScript in the browser console and understand client-side execution.',
        resources: [],
        completed: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=150&fit=crop',
      },
      {
        id: 'l2',
        title: 'Variables and Data Types',
        description: 'Understanding var, let, const and primitive data types',
        type: 'article',
        duration: 20,
        content: 'Deep dive into JavaScript variables and data types.',
        resources: [],
        completed: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=200&h=150&fit=crop',
      },
      {
        id: 'l3',
        title: 'Functions & Scope',
        description: 'Master functions, closures, and scope',
        type: 'exercise',
        duration: 30,
        content: 'Practice writing functions and understanding scope.',
        resources: [],
        completed: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=150&fit=crop',
      },
    ],
    progress: 0,
    status: 'not-started',
    category: 'Programming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'React Fundamentals',
    description: 'Learn the fundamentals of React, the popular JavaScript library for building user interfaces. Master components, state, props, and hooks.',
    icon: '⚛️',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
    lessons: [],
    progress: 45,
    status: 'in-progress',
    category: 'Programming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'TypeScript Essentials',
    description: 'Master TypeScript and add type safety to your JavaScript applications. Learn interfaces, generics, and advanced types.',
    icon: '🔷',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop',
    lessons: [],
    progress: 100,
    status: 'completed',
    category: 'Programming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function Learning() {
  const [courses, setCourses] = useLocalStorage<Course[]>('learning-courses', SAMPLE_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const markLessonComplete = (courseId: string, lessonId: string) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const updatedLessons = course.lessons.map(lesson =>
          lesson.id === lessonId ? { ...lesson, completed: true } : lesson
        );
        const completedCount = updatedLessons.filter(l => l.completed).length;
        const progress = Math.round((completedCount / updatedLessons.length) * 100);
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';

        return {
          ...course,
          lessons: updatedLessons,
          progress,
          status: status as Course['status'],
        };
      }
      return course;
    });
    setCourses(updatedCourses);

    if (selectedCourse) {
      const updated = updatedCourses.find(c => c.id === courseId);
      if (updated) setSelectedCourse(updated);
    }

    toast.success('Lesson completed! 🎉');
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  // Course Detail View
  if (selectedCourse) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCourse(null)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{selectedCourse.icon}</span>
              <h1 className="text-3xl font-bold">{selectedCourse.title}</h1>
            </div>
            <p className="text-muted-foreground">{selectedCourse.description}</p>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Your Progress</h3>
            </div>
            <Badge variant={selectedCourse.status === 'completed' ? 'success' : 'primary'}>
              {selectedCourse.progress}% Complete
            </Badge>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
              style={{ width: `${selectedCourse.progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {selectedCourse.lessons.filter(l => l.completed).length} of {selectedCourse.lessons.length} lessons completed
          </p>
        </Card>

        {/* Media Gallery */}
        {selectedCourse.lessons.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Lessons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {selectedCourse.lessons.slice(0, 4).map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => openLesson(lesson)}
                  className="relative group overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all animate-in zoom-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
                    {lesson.thumbnailUrl ? (
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/10" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    {lesson.completed && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="space-y-3">
          {selectedCourse.lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              hover
              className={clsx(
                "cursor-pointer transition-all",
                lesson.completed && "bg-green-500/5 border-green-500/20"
              )}
              onClick={() => openLesson(lesson)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  lesson.completed ? "bg-green-500 text-white" : "bg-primary/10"
                )}>
                  {lesson.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : lesson.type === 'video' ? (
                    <Video className={clsx("w-6 h-6", !lesson.completed && "text-primary")} />
                  ) : lesson.type === 'article' ? (
                    <FileText className={clsx("w-6 h-6", !lesson.completed && "text-primary")} />
                  ) : (
                    <Code className={clsx("w-6 h-6", !lesson.completed && "text-primary")} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{lesson.title}</h4>
                    {lesson.duration && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration}min
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>

        {/* Lesson Modal */}
        {showLessonModal && selectedLesson && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={() => setShowLessonModal(false)}
          >
            <Card
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedLesson.title}</h2>
                    <p className="text-muted-foreground">{selectedLesson.description}</p>
                  </div>
                  {selectedLesson.completed && (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-accent/50 border border-border">
                  <p className="text-sm">{selectedLesson.content}</p>
                </div>

                {selectedLesson.type === 'video' && (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <PlayCircle className="w-16 h-16 text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Video player coming soon</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {!selectedLesson.completed && (
                    <button
                      onClick={() => {
                        markLessonComplete(selectedCourse.id, selectedLesson.id);
                        setShowLessonModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Mark as Complete
                    </button>
                  )}
                  <button
                    onClick={() => setShowLessonModal(false)}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Courses List View
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Learning Center
        </h1>
        <p className="text-muted-foreground">Explore courses and expand your knowledge</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                "px-4 py-3 rounded-xl font-medium transition-all capitalize",
                filterCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: courses.length.toString(), icon: BookOpen, color: 'text-blue-500' },
          { label: 'In Progress', value: courses.filter(c => c.status === 'in-progress').length.toString(), icon: TrendingUp, color: 'text-orange-500' },
          { label: 'Completed', value: courses.filter(c => c.status === 'completed').length.toString(), icon: Award, color: 'text-green-500' },
          { label: 'Hours Learned', value: '24', icon: Clock, color: 'text-purple-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              hover
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color.replace('text-', 'bg-')}/10`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </Card>
          );
        })}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No courses found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <Card
              key={course.id}
              hover
              className="cursor-pointer group"
              onClick={() => setSelectedCourse(course)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Cover Image */}
              <div className="h-40 -mx-4 -mt-4 mb-4 rounded-t-xl overflow-hidden relative">
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-3xl">{course.icon}</span>
                  {course.status === 'completed' && (
                    <div className="px-2 py-1 bg-green-500 rounded-lg flex items-center gap-1">
                      <Award className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </div>

                {/* Progress */}
                {course.progress > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium text-primary">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Badge variant="default">{course.category}</Badge>
                  {course.lessons.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
