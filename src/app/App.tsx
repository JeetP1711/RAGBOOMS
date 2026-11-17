import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Spinner } from '@/components/ui'
import About from '@/pages/About'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import ProjectDetail from '@/pages/ProjectDetail'
import Projects from '@/pages/Projects'
import { Achievements, Contact, Experience, Github, Labs } from '@/pages/Simple'

// The admin panel is code-split so visitors never download it.
const admin = () => import('@/admin')
const AdminRoot = lazy(() => admin().then((m) => ({ default: m.AdminRoot })))
const AdminLayout = lazy(() => admin().then((m) => ({ default: m.AdminLayout })))
const Login = lazy(() => admin().then((m) => ({ default: m.Login })))
const Dashboard = lazy(() => admin().then((m) => ({ default: m.Dashboard })))
const ProjectsAdmin = lazy(() => admin().then((m) => ({ default: m.ProjectsAdmin })))
const ProjectEditor = lazy(() => admin().then((m) => ({ default: m.ProjectEditor })))
const ExperienceAdmin = lazy(() => admin().then((m) => ({ default: m.ExperienceAdmin })))
const SkillsAdmin = lazy(() => admin().then((m) => ({ default: m.SkillsAdmin })))
const AchievementsAdmin = lazy(() => admin().then((m) => ({ default: m.AchievementsAdmin })))
const ProfileAdmin = lazy(() => admin().then((m) => ({ default: m.ProfileAdmin })))
const MediaAdmin = lazy(() => admin().then((m) => ({ default: m.MediaAdmin })))
const Messages = lazy(() => admin().then((m) => ({ default: m.Messages })))
const GithubAdmin = lazy(() => admin().then((m) => ({ default: m.GithubAdmin })))
const SettingsAdmin = lazy(() => admin().then((m) => ({ default: m.SettingsAdmin })))

const Loading = () => (
  <div className="grid min-h-dvh place-items-center">
    <Spinner className="size-6 text-hi" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:slug" element={<ProjectDetail />} />
          <Route path="experience" element={<Experience />} />
          <Route path="labs" element={<Labs />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="github" element={<Github />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<AdminRoot />}>
          <Route path="login" element={<Login />} />
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsAdmin />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
            <Route path="experience" element={<ExperienceAdmin />} />
            <Route path="skills" element={<SkillsAdmin />} />
            <Route path="achievements" element={<AchievementsAdmin />} />
            <Route path="profile" element={<ProfileAdmin />} />
            <Route path="media" element={<MediaAdmin />} />
            <Route path="messages" element={<Messages />} />
            <Route path="github" element={<GithubAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
