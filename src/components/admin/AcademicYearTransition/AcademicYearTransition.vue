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
    watch: {
        // Синхронизация шага с URL
        step(newStep) {
            this.updateRoute(newStep)
        },
        // Обработка изменения роута
        '$route.query.step': {
            immediate: true,
            handler(newStep) {
                if (newStep) {
                    this.step = parseInt(newStep)
                }
            }
        }
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
        // Обновление URL при изменении шага
        updateRoute(step) {
            if (this.$route.query.step !== step.toString()) {
                this.$router.replace({
                    query: { ...this.$route.query, step }
                }).catch(() => { })
            }
        },
        handleNextStep() {
            if (this.step === 3 && this.$refs.currentStep.noStudentsInLeave) {
                this.step = 5 // Пропускаем шаг 4 если нет студентов в академе
            } else if (this.step === 4 && this.$refs.currentStep.noStudentsToContinue) {
                this.step = 5 // Пропускаем шаг 5 если нет студентов для перевода
            } else {
                this.step = Math.min(this.step + 1, 6) // Не превышаем максимальный шаг
            }
        },
        handlePrevStep() {
            // Умная навигация назад с учетом пропущенных шагов
            if (this.step === 5) {
                if (this.$refs.currentStep.noStudentsToContinue) {
                    this.step = 3
                } else if (this.$refs.currentStep.noStudentsInLeave) {
                    this.step = 1
                } else {
                    this.step = 4
                }
            } else {
                this.step = Math.max(this.step - 1, 1) // Не опускаемся ниже 1
            }
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