
import { createRouter, createWebHistory } from 'vue-router';

import Login from './views/Login.vue';
import Register from './views/Register.vue';
import MyPage from './views/MyPage.vue';
import GroupPage from './views/GroupPage.vue';

import Archive from './views/ArchivePage.vue';

import AdminPage from './views/AdminPage.vue';
import ApprovePage from './views/ApproveUsers.vue';
import AcademicYearTransition from './components/admin/AcademicYearTransition/AcademicYearTransition.vue';
import NextMonth from './views/NextMonth.vue';
import NextSemester from './views/NextSemester.vue';
import StatsView from './views/StatsView.vue';


const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/my', component: MyPage, meta: { requiresAuth: true } },
  { path: '/group/:id', component: GroupPage, props: true },
  { path: '/group/:id/subjects/:subjectId', component: GroupPage, props: true },
  { path: '/group/:id/subjects', component: GroupPage, props: true },
  { path: '/stats', component: StatsView, props: true },

  { path: '/archive', component: Archive },

  { path: '/admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/approve-users', name: 'ApproveUsers', component: ApprovePage, meta: { requiresAuth: true, requiresAdmin: true } },
  // { path: '/admin/promote-students', name: 'PromoteStudents', component: PromotePage, meta: { requiresAuth: true, requiresAdmin: true } },
  {
    path: '/admin/academic-year-transition',
    name: 'AcademicYearTransition',
    component: AcademicYearTransition,
    meta: { requiresAuth: true }
  },
  { path: '/admin/next-month', component: NextMonth, meta: { requiresAdmin: true } },
  { path: '/admin/next-semester', component: NextSemester, meta: { requiresAdmin: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  if (to.meta.requiresAdmin && role !== 'admin') {
    if(role == 'teacher' || role == 'senior_teacher'){
      return next('/my');
    }
    else{
      return next('/login');
    }
  }

  next();
});

export default router;
