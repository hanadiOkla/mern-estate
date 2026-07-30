import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';

export default function AdminPrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);

  // نتحقق من وجود المستخدم وأن لديه صلاحية admin
  return currentUser && currentUser.role === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to='/sign-in' />
  );
}