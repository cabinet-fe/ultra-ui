<template>
  <div class="showcase">
    <!-- Floating Orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Hero Section -->
    <div class="hero">
      <div class="hero-badge">
        <u-badge :value="'v1.0'" type="primary">
          <span class="badge-text">✨ Modern UI Component Library</span>
        </u-badge>
      </div>
      <h1 class="title">Build Beautiful Interfaces</h1>
      <p class="subtitle">A stunning, flexible, and fully typed Vue 3 component library.</p>
      <div class="actions">
        <u-button type="primary" size="large" class="hero-btn shadow-btn">Get Started</u-button>
        <u-button size="large" plain class="hero-btn">
          <u-icon><Setting /></u-icon> View Docs
        </u-button>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="bento-grid">
      <!-- 1. Payment Method -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>Payment Method</h3>
            <p>Update your billing details.</p>
          </div>
        </template>
        <div class="card-content column">
          <div class="row">
            <u-button type="primary" plain class="flex-1"
              ><u-icon><CreditCard /></u-icon> Card</u-button
            >
            <u-button plain class="flex-1"
              ><u-icon><Wallet /></u-icon> Wallet</u-button
            >
          </div>
          <div class="column gap-sm mt-4">
            <label class="text-sm font-medium">Name</label>
            <u-input placeholder="First Last" />
          </div>
          <div class="column gap-sm mt-2">
            <label class="text-sm font-medium">Card Number</label>
            <u-input placeholder="0000 0000 0000 0000">
              <template #prefix
                ><u-icon><CreditCard /></u-icon
              ></template>
            </u-input>
          </div>
          <div class="row gap-md mt-2">
            <div class="column gap-sm flex-1">
              <label class="text-sm font-medium">Expires</label>
              <u-select v-model="month" :options="months" placeholder="Month" />
            </div>
            <div class="column gap-sm flex-1">
              <label class="text-sm font-medium">Year</label>
              <u-select v-model="year" :options="years" placeholder="Year" />
            </div>
          </div>
          <u-button type="primary" class="w-full mt-4">Continue</u-button>
        </div>
      </u-card>

      <!-- 2. Notifications -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>Notifications</h3>
            <p>Manage your alert settings.</p>
          </div>
        </template>
        <div class="card-content column list-view">
          <div class="list-item">
            <div class="icon-bg primary">
              <u-icon><Bell /></u-icon>
            </div>
            <div class="list-item-text">
              <h4>Push Notifications</h4>
              <p>Send to your device.</p>
            </div>
            <u-switch v-model="s1" type="primary" />
          </div>
          <div class="list-item">
            <div class="icon-bg warning">
              <u-icon><User /></u-icon>
            </div>
            <div class="list-item-text">
              <h4>Mentions</h4>
              <p>When someone tags you.</p>
            </div>
            <u-switch v-model="s2" type="warning" />
          </div>
          <div class="divider"></div>
          <h4 class="font-medium text-sm">Alert Volume</h4>
          <u-slider v-model="vol" />
          <div class="row space-between mt-2">
            <u-checkbox v-model="c1">System sounds</u-checkbox>
            <u-badge :value="3" type="danger">
              <u-button circle plain
                ><u-icon><Bell /></u-icon
              ></u-button>
            </u-badge>
          </div>
        </div>
      </u-card>

      <!-- 3. Storage -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>Storage</h3>
            <p>Cloud drive usage.</p>
          </div>
        </template>
        <div class="card-content column flex-1 justify-center">
          <div class="storage-info">
            <h2>86.5<span class="unit">GB</span></h2>
            <span class="text-second limit">/ 100 GB</span>
          </div>
          <u-progress :percentage="86.5" type="primary"></u-progress>
          <p class="mt-4 text-sm text-second">
            You have used 86% of your capacity. Upgrade your plan to get more space.
          </p>
          <div class="row gap-sm mt-4">
            <u-tag type="primary" effect="dark">Images: 45GB</u-tag>
            <u-tag type="info">Docs: 20GB</u-tag>
          </div>
        </div>
      </u-card>

      <!-- 4. Schedule -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>Schedule</h3>
            <p>Upcoming meetings.</p>
          </div>
        </template>
        <div class="card-content column">
          <u-date-picker v-model="date" type="date" style="width: 100%" />
          <div class="schedule-items mt-4 column gap-md">
            <div class="schedule-item">
              <div class="line primary"></div>
              <div class="info">
                <h4>Design Sync</h4>
                <span class="text-xs text-second">9:00 AM - 10:00 AM</span>
              </div>
            </div>
            <div class="schedule-item">
              <div class="line warning"></div>
              <div class="info">
                <h4>Product Review</h4>
                <span class="text-xs text-second">2:00 PM - 3:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </u-card>

      <!-- 5. Team Members (Spans 2 cols) -->
      <u-card class="bento-card col-span-2">
        <template #header>
          <div class="card-header">
            <h3>Team Members</h3>
            <p>Invite your team members to collaborate.</p>
          </div>
        </template>
        <div class="card-content column flex-1 list-view">
          <div class="list-item space-between">
            <div class="row align-center gap-md">
              <div class="avatar">
                <u-icon><User /></u-icon>
              </div>
              <div class="list-item-text">
                <h4>Sofia Davis</h4>
                <p>m@example.com</p>
              </div>
            </div>
            <u-select v-model="role1" :options="roleOptions" style="width: 140px" />
          </div>
          <div class="list-item space-between">
            <div class="row align-center gap-md">
              <div class="avatar warning-bg">
                <u-icon><User /></u-icon>
              </div>
              <div class="list-item-text">
                <h4>Jackson Lee</h4>
                <p>p@example.com</p>
              </div>
            </div>
            <u-select v-model="role2" :options="roleOptions" style="width: 140px" />
          </div>

          <div class="divider"></div>

          <div class="row space-between align-center">
            <div class="column gap-sm">
              <h4 class="font-medium text-sm">Share link</h4>
              <p class="text-xs text-second">Anyone with the link can view this project.</p>
            </div>
          </div>
          <div class="row gap-md mt-2">
            <u-input model-value="https://ultra-ui.com/share/xYz" class="flex-1" native-readonly />
            <u-button type="primary">Copy Link</u-button>
          </div>
        </div>
      </u-card>

      <!-- 6. Profile Settings -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>Profile Settings</h3>
            <p>Update your account information.</p>
          </div>
        </template>
        <div class="card-content column">
          <div class="column gap-sm">
            <label class="text-sm font-medium">Username</label>
            <u-input placeholder="Enter username" />
          </div>
          <div class="column gap-sm mt-4">
            <label class="text-sm font-medium">Role</label>
            <u-radio-group
              v-model="formRole"
              :items="[
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' }
              ]"
            />
          </div>
          <div class="column gap-sm mt-4">
            <label class="text-sm font-medium">Bio</label>
            <u-textarea placeholder="Tell us about yourself" :rows="2" />
          </div>
          <div class="mt-auto pt-4">
            <u-button type="primary" class="w-full">Save Changes</u-button>
          </div>
        </div>
      </u-card>

      <!-- 7. Data Table (Spans 2 cols) -->
      <u-card class="bento-card col-span-2">
        <template #header>
          <div class="card-header">
            <h3>Recent Orders</h3>
            <p>Your latest transactions and their status.</p>
          </div>
        </template>
        <div class="card-content column">
          <u-table :data="tableData" :columns="tableColumns" style="flex: 1" />
          <div class="row space-between mt-4 align-center">
            <span class="text-xs text-second">Showing 1 to 5 of 100 entries</span>
            <u-paginator :total="100" v-model:page-number="page" :page-size="10" size="small" />
          </div>
        </div>
      </u-card>

      <!-- 8. System Controls -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>System Controls</h3>
            <p>Manage performance settings.</p>
          </div>
        </template>
        <div class="card-content column">
          <div class="row space-between align-center">
            <span class="text-sm font-medium">Auto-scaling</span>
            <u-switch v-model="autoScale" />
          </div>
          <div class="row space-between align-center mt-4">
            <span class="text-sm font-medium">Max Instances</span>
            <u-number-input v-model="instances" :min="1" :max="10" style="width: 120px" />
          </div>
          <div class="divider mt-4"></div>
          <div class="column gap-sm mt-4">
            <span class="text-sm font-medium">Environment Tags</span>
            <div class="row gap-sm flex-wrap">
              <u-check-tag v-model="tag1" :checked="tag1" type="primary">Production</u-check-tag>
              <u-check-tag v-model="tag2" :checked="tag2" type="warning">Staging</u-check-tag>
              <u-check-tag v-model="tag3" :checked="tag3" type="success">Testing</u-check-tag>
            </div>
          </div>
          <div class="mt-auto pt-4 row justify-center">
            <u-tip content="View detailed logs" direction="top">
              <u-button plain circle
                ><u-icon><Setting /></u-icon
              ></u-button>
            </u-tip>
          </div>
        </div>
      </u-card>

      <!-- 9. File Directory -->
      <u-card class="bento-card">
        <template #header>
          <div class="card-header">
            <h3>File Directory</h3>
            <p>Browse your project files.</p>
          </div>
        </template>
        <div class="card-content column" style="overflow: hidden">
          <u-tree
            :data="treeData"
            label-key="name"
            value-key="id"
            expand-all
            checkable
            style="height: 100%; min-height: 200px"
          />
        </div>
      </u-card>

      <!-- 10. Project Workflow (Spans 2 cols) -->
      <u-card class="bento-card col-span-2">
        <template #header>
          <div class="card-header">
            <h3>Project Workflow</h3>
            <p>Track your project progress and details.</p>
          </div>
        </template>
        <div class="card-content column">
          <div class="px-4 py-2">
            <u-steps
              :items="[
                { label: 'Planning' },
                { label: 'Development' },
                { label: 'Testing' },
                { label: 'Deployment' }
              ]"
              :current="1"
              size="small"
            />
          </div>
          <div class="mt-6 flex-1">
            <u-tabs
              v-model="tabActive"
              :items="[
                { key: 'overview', name: 'Overview' },
                { key: 'tasks', name: 'Tasks' },
                { key: 'files', name: 'Files' }
              ]"
            >
              <template #overview>
                <div
                  class="mt-4 p-4"
                  style="
                    background: var(--u-bg-color-hover);
                    border-radius: var(--u-radius-default);
                  "
                >
                  <p class="text-sm text-second m-0">
                    Project is currently in the development phase. All initial planning has been
                    completed.
                  </p>
                </div>
              </template>
              <template #tasks>
                <div class="mt-4">
                  <u-collapse v-model="collapseActive">
                    <u-collapse-item title="Frontend Development" value="1">
                      <p class="text-sm text-second m-0">
                        Implement UI components and connect to API.
                      </p>
                    </u-collapse-item>
                    <u-collapse-item title="Backend Architecture" value="2">
                      <p class="text-sm text-second m-0">
                        Design database schema and REST endpoints.
                      </p>
                    </u-collapse-item>
                  </u-collapse>
                </div>
              </template>
              <template #files>
                <div class="mt-4 flex-center" style="height: 100px">
                  <u-empty text="No files uploaded yet" />
                </div>
              </template>
            </u-tabs>
          </div>
        </div>
      </u-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CreditCard, Wallet, Bell, User, Setting } from '@veltra/icons/normal'
import { ref } from 'vue'

const date = ref(new Date())
const s1 = ref(true)
const s2 = ref(false)
const vol = ref(75)
const c1 = ref(true)

const month = ref('Jan')
const months = [
  { label: 'January', value: 'Jan' },
  { label: 'February', value: 'Feb' },
  { label: 'March', value: 'Mar' },
  { label: 'April', value: 'Apr' }
]

const year = ref('2026')
const years = [
  { label: '2026', value: '2026' },
  { label: '2027', value: '2027' },
  { label: '2028', value: '2028' },
  { label: '2029', value: '2029' }
]

const role1 = ref('owner')
const role2 = ref('member')
const roleOptions = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' }
]

const formRole = ref('admin')

const page = ref(1)
const tableData = [
  { id: 'ORD-001', customer: 'John Doe', status: 'Completed', amount: '$120.00' },
  { id: 'ORD-002', customer: 'Alice Smith', status: 'Pending', amount: '$45.00' },
  { id: 'ORD-003', customer: 'Bob Johnson', status: 'Failed', amount: '$85.00' },
  { id: 'ORD-004', customer: 'Emma Davis', status: 'Processing', amount: '$210.50' },
  { id: 'ORD-005', customer: 'Michael Brown', status: 'Completed', amount: '$60.00' }
]
const tableColumns = [
  { key: 'id', name: 'Order ID' },
  { key: 'customer', name: 'Customer' },
  { key: 'status', name: 'Status' },
  { key: 'amount', name: 'Amount' }
]

const autoScale = ref(true)
const instances = ref(3)
const tag1 = ref(true)
const tag2 = ref(false)
const tag3 = ref(true)

const treeData = [
  {
    id: 'src',
    name: 'src',
    children: [
      { id: 'components', name: 'components' },
      { id: 'assets', name: 'assets' },
      { id: 'utils', name: 'utils' }
    ]
  },
  {
    id: 'public',
    name: 'public',
    children: [{ id: 'favicon.ico', name: 'favicon.ico' }]
  },
  { id: 'package.json', name: 'package.json' }
]

const tabActive = ref('tasks')
const collapseActive = ref('1')
</script>

<style scoped>
.showcase {
  position: relative;
  margin: 0 auto;
  padding: 40px 20px 80px;
  overflow: visible;
  background-color: #f0f4f8;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.08), transparent);
}

:global(html[data-theme='dark'] .showcase) {
  background-color: #0a0f1e;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.18), transparent),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.15), transparent),
    radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.12), transparent);
}

/* 网格层 */
.showcase::before {
  content: '';
  position: absolute;
  top: -100px;
  left: -50vw;
  right: -50vw;
  height: 800px;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 0;
  pointer-events: none;
}

:global(html[data-theme='dark'] .showcase::before) {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
}

.hero {
  position: relative;
  text-align: center;
  margin-bottom: 80px;
  margin-top: 40px;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  margin-bottom: 24px;
}

.badge-text {
  padding: 2px 8px;
  font-weight: 500;
}

.title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--u-text-color-title);
}

.subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--u-text-color-second);
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.hero-btn {
  border-radius: var(--u-radius-large);
  padding: 0 24px;
}

.shadow-btn {
  box-shadow: 0 10px 25px rgba(var(--u-color-primary-rgb, 30, 136, 229), 0.3);
}

.bento-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .col-span-2 {
    grid-column: span 2;
  }
  .col-span-3 {
    grid-column: span 3;
  }
}

.bento-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--u-bg-color-top);
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-large);
}

.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px var(--u-shadow-color, rgba(0, 0, 0, 0.06));
}

.card-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--u-border-color);
  background: var(--u-bg-color-top);
  border-top-left-radius: var(--u-radius-large);
  border-top-right-radius: var(--u-radius-large);
}

.card-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--u-text-color-title);
  letter-spacing: -0.02em;
}

.card-header p {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--u-text-color-second);
}

.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column {
  display: flex;
  flex-direction: column;
}

.gap-sm {
  gap: 8px;
}
.gap-md {
  gap: 16px;
}

.flex-1 {
  flex: 1;
}
.w-full {
  width: 100%;
}
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}

.text-sm {
  font-size: 0.875rem;
}
.text-xs {
  font-size: 0.75rem;
}
.text-second {
  color: var(--u-text-color-second);
}
.font-medium {
  font-weight: 500;
  color: var(--u-text-color-title);
}

.space-between {
  justify-content: space-between;
}
.align-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}

.mt-auto {
  margin-top: auto;
}
.pt-4 {
  padding-top: 16px;
}
.px-4 {
  padding-left: 16px;
  padding-right: 16px;
}
.py-2 {
  padding-top: 8px;
  padding-bottom: 8px;
}
.m-0 {
  margin: 0;
}
.flex-wrap {
  flex-wrap: wrap;
}
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-view {
  gap: 20px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.list-item-text h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.list-item-text p {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--u-text-color-second);
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--u-radius-default);
  font-size: 20px;
}
.icon-bg.primary {
  background: var(--u-color-primary-light-9);
  color: var(--u-color-primary);
}
.icon-bg.warning {
  background: var(--u-color-warning-light-9);
  color: var(--u-color-warning);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--u-bg-color-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--u-text-color-main);
  border: 1px solid var(--u-border-color);
  font-size: 20px;
}
.avatar.warning-bg {
  background: var(--u-color-warning);
  color: #fff;
  border: none;
}

.divider {
  height: 1px;
  background: var(--u-border-color);
  margin: 4px 0;
}

.storage-info {
  display: flex;
  align-items: baseline;
}

.storage-info h2 {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--u-text-color-title);
  letter-spacing: -0.05em;
}

.storage-info .unit {
  font-size: 1.5rem;
  margin-left: 4px;
}

.storage-info .limit {
  font-size: 1.1rem;
  margin-left: 8px;
}

.schedule-item {
  display: flex;
  align-items: stretch;
  gap: 12px;
}
.schedule-item .line {
  width: 4px;
  border-radius: 2px;
}
.schedule-item .line.primary {
  background: var(--u-color-primary);
}
.schedule-item .line.warning {
  background: var(--u-color-warning);
}

.schedule-item .info h4 {
  margin: 0 0 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--u-text-color-title);
}

:deep(.u-card__header),
:deep(.u-card__body) {
  padding: 0 !important;
}

/* Floating Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  left: 5%;
  background: rgba(59, 130, 246, 0.08);
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  top: 30%;
  right: 5%;
  background: rgba(139, 92, 246, 0.06);
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  bottom: 15%;
  left: 40%;
  background: rgba(14, 165, 233, 0.07);
  animation-delay: -14s;
}

:global(html[data-theme='dark'] .orb-1) {
  background: rgba(59, 130, 246, 0.15);
}

:global(html[data-theme='dark'] .orb-2) {
  background: rgba(139, 92, 246, 0.12);
}

:global(html[data-theme='dark'] .orb-3) {
  background: rgba(14, 165, 233, 0.1);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
