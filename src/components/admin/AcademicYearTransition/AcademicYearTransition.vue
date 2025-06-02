<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">Admin</router-link>
            <button @click="logout" class="logout-button">Выйти</button>
        </header>

        <main class="main flex-1 p-4">
            <component :is="currentStepComponent" :current-step="step" :current-year="currentYear" :next-year="nextYear"
                :current-year-id="currentYearId" @next-step="handleNextStep" @prev-step="handlePrevStep"
                @complete="handleComplete" />
        </main>

        <footer class="footer">© 2025 Дипломная работа</footer>
    </div>
</template>

<script>
import Step1Initial from './steps/Step1Initial.vue';
import Step2Graduates from './steps/Step2Graduates.vue';
import Step3AcademicLeaves from './steps/Step3AcademicLeaves.vue';
import Step4ContinuingStudents from './steps/Step4ContinuingStudents.vue';
import Step5NewGroups from './steps/Step5NewGroups.vue';
import Step6Finalize from './steps/Step6Finalize.vue';
import router from '@/router';

const steps = {
    1: Step1Initial,
    2: Step2Graduates,
    3: Step3AcademicLeaves,
    4: Step4ContinuingStudents,
    5: Step5NewGroups,
    6: Step6Finalize
};

export default {
    components: {
        Step1Initial,
        Step2Graduates,
        Step3AcademicLeaves,
        Step4ContinuingStudents,
        Step5NewGroups,
        Step6Finalize
    },
    data() {
        return {
            step: 1,
            currentYear: '',
            nextYear: '',
            currentYearId: null
        };
    },
    computed: {
        currentStepComponent() {
            return steps[this.step];
        }
    },
    methods: {
        async fetchYearInfo() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('https://backend-8qud.onrender.com/api/academic-year/transition-info', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    this.currentYear = response.data.data.currentYear;
                    this.nextYear = response.data.data.nextYear;
                    this.currentYearId = response.data.data.currentYearId;
                }
            } catch (err) {
                console.error('Ошибка:', err);
            }
        },
        handleNextStep() {
            this.step++;
        },
        handlePrevStep() {
            this.step--;
        },
        handleComplete() {
            router.push('/admin');
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('name');
            router.push('/login');
        }
    },
    async created() {
        await this.fetchYearInfo();
    }
};
</script>

<!-- <style scoped>
/* Ваши стили остаются здесь */
.header {
    /* стили для header */
}

/* и т.д. */
</style> -->