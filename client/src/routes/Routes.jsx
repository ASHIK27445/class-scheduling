import { createBrowserRouter } from "react-router"
import App from "../App"
import TaskJob from "../components/task/TaskMain"
import TaskMain from "../components/task/TaskMain"
import Dashboard from "../components/task/Dashboard"
import StudentView from "../components/task/StudentBookingView"
import TeacherView from "../components/task/TeacherView"
import MySlots from "../components/task/MySlots"
export const router = createBrowserRouter([
    {
        path: '/', Component: TaskMain,
        children: [
            {index: true, Component: Dashboard},
            {path:'/student', Component: StudentView},
            {path:'/teacher', Component: TeacherView },
            {path:'/my-slots', Component: MySlots}
        ]
    }
])
