<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Добавление групп первокурсников</h3>

        <div class="tabs mb-4">
            <button @click="addMethod = 'manual'" :class="{ 'tab-active': addMethod === 'manual' }">
                Ручной ввод
            </button>
            <button @click="addMethod = 'excel'" :class="{ 'tab-active': addMethod === 'excel' }">
                Импорт из Excel
            </button>
        </div>

        <!-- Ручной ввод -->
        <div v-if="addMethod === 'manual'" class="manual-input">
            <div class="form-group">
                <label>Название группы:</label>
                <input v-model="newGroup.name" placeholder="Например: 101-1">
            </div>

            <div class="form-group">
                <label>Студенты (по одному в строке):</label>
                <textarea v-model="newGroup.studentsText" rows="10"></textarea>
            </div>

            <button @click="addManualGroup" class="btn-save">Добавить группу</button>
        </div>

        <!-- Импорт из Excel -->
        <div v-else class="excel-import">
            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx,.xls">

            <div v-if="excelData" class="preview">
                <h4>Проверьте данные перед сохранением (всего групп: {{ excelData.length }})</h4>

                <div v-for="(group, groupIndex) in excelData" :key="groupIndex"
                    class="group-container mb-6 p-4 border rounded">
                    <div class="form-group">
                        <label>Название группы:</label>
                        <input v-model="group.proposedGroupName"
                            :class="{ 'error-input': !isValidGroupName(group.proposedGroupName) }">
                        <span v-if="!isValidGroupName(group.proposedGroupName)" class="error-message">
                            Неверный формат названия группы. Формат: 1234567/12345
                        </span>
                    </div>

                    <table class="w-full">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>ФИО студента</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(student, index) in group.students" :key="index">
                                <td>{{ student.number }}</td>
                                <td>
                                    <input v-model="student.full_name">
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 flex justify-center">
                    <button @click="confirmAllGroups" class="btn-save">
                        Добавить все группы ({{ excelData.length }})
                    </button>
                </div>
            </div>
        </div>

        <div class="mt-8 pt-4 border-t">
            <button @click="$emit('next-step')" class="btn-continue" :disabled="processing">
                Продолжить переход
            </button>
            <button @click="$emit('prev-step')" class="btn-secondary ml-4">
                Назад
            </button>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        currentYearId: Number
    },
    data() {
        return {
            addMethod: 'manual',
            newGroup: {
                name: '',
                studentsText: ''
            },
            excelData: null,
            file: null,
            processing: false
        };
    },
    methods: {
        isValidGroupName(name) {
            return /^\d{7}\/\d{5}$/.test(name);
        },
        async handleFileUpload(event) {
            this.file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', this.file);

            try {
                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/groups/parse-excel',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                this.excelData = response.data.data;
            } catch (err) {
                console.error('Ошибка при обработке файла:', err);
            }
        },
        async confirmAllGroups() {
            const invalidGroups = this.excelData.filter(
                group => !this.isValidGroupName(group.proposedGroupName)
            ).map(group => group.proposedGroupName);

            if (invalidGroups.length > 0) {
                alert(`Некорректные названия групп:\n${invalidGroups.join('\n')}\n\nФормат: 1234567/12345`);
                return;
            }

            this.processing = true;
            const groupsCount = this.excelData.length;

            try {
                for (const group of this.excelData) {
                    await axios.post(
                        'https://backend-8qud.onrender.com/api/academic-year/groups/manual',
                        {
                            groupName: group.proposedGroupName,
                            students: group.students.map(s => s.full_name),
                            yearId: this.currentYearId
                        },
                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );
                }

                this.excelData = null;
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.value = '';
                }
            } catch (err) {
                console.error('Ошибка при создании групп:', err);
            } finally {
                this.processing = false;
            }
        },
        async addManualGroup() {
            const students = this.newGroup.studentsText
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            try {
                await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/groups/manual',
                    {
                        groupName: this.newGroup.name,
                        students,
                        yearId: this.currentYearId
                    },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                this.newGroup = { name: '', studentsText: '' };
            } catch (err) {
                console.error('Ошибка при создании группы:', err);
            }
        }
    }
};
</script>

<style scoped>
.tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
}

.tabs button {
    padding: 8px 16px;
    background: #f5f5f5;
    border: none;
    cursor: pointer;
}

.tabs button.tab-active {
    background: #fff;
    border-bottom: 2px solid #3b82f6;
    font-weight: bold;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.error-input {
    border-color: #ef4444 !important;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
}

.btn-save {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.btn-save:hover {
    background-color: #2563eb;
}

.btn-continue {
    background-color: #10b981;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.btn-continue:hover {
    background-color: #059669;
}

.btn-continue:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
}

.btn-secondary {
    background-color: #6b7280;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.btn-secondary:hover {
    background-color: #4b5563;
}
</style>