import React, { useState } from "react";
import {
  Button,
  Input,
  Switch,
  Slider,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Card,
  Tabs,
  List,
  Table,
  Tree,
  Select,
  Modal,
  Drawer,
  Form,
  FormItem,
  type ColumnType,
  type TreeNodeData,
} from "@/components";
import {
  BiUser,
  BiSearch,
  BiEnvelope,
  BiHeart,
  BiStar,
  BiTrash,
  BiEdit,
  BiPlus,
} from "react-icons/bi";

// ==================== 组件展示页面 ====================

interface UserData extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  age: number;
}

const treeData: TreeNodeData[] = [
  {
    key: "1",
    title: "系统管理",
    children: [
      { key: "1-1", title: "用户管理" },
      { key: "1-2", title: "角色管理" },
      { key: "1-3", title: "权限管理" },
    ],
  },
  {
    key: "2",
    title: "内容管理",
    children: [
      { key: "2-1", title: "文章管理" },
      { key: "2-2", title: "分类管理" },
      { key: "2-3", title: "标签管理" },
    ],
  },
  {
    key: "3",
    title: "数据统计",
    children: [
      { key: "3-1", title: "访问统计" },
      { key: "3-2", title: "用户分析" },
    ],
  },
];

const mockData: UserData[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    role: "管理员",
    status: "active",
    age: 28,
  },
  { id: "2", name: "李四", email: "lisi@example.com", role: "编辑", status: "active", age: 32 },
  { id: "3", name: "王五", email: "wangwu@example.com", role: "用户", status: "inactive", age: 25 },
  { id: "4", name: "赵六", email: "zhaoliu@example.com", role: "用户", status: "active", age: 30 },
  { id: "5", name: "钱七", email: "qianqi@example.com", role: "编辑", status: "active", age: 27 },
  { id: "6", name: "孙八", email: "sunba@example.com", role: "用户", status: "active", age: 24 },
  {
    id: "7",
    name: "周九",
    email: "zhoujiu@example.com",
    role: "用户",
    status: "inactive",
    age: 29,
  },
  { id: "8", name: "吴十", email: "wushi@example.com", role: "编辑", status: "active", age: 31 },
  {
    id: "9",
    name: "郑十一",
    email: "zhengshiyi@example.com",
    role: "用户",
    status: "active",
    age: 26,
  },
  {
    id: "10",
    name: "陈十二",
    email: "chenshier@example.com",
    role: "管理员",
    status: "active",
    age: 33,
  },
  {
    id: "11",
    name: "刘十三",
    email: "liushisan@example.com",
    role: "用户",
    status: "inactive",
    age: 22,
  },
  {
    id: "12",
    name: "黄十四",
    email: "huangshisi@example.com",
    role: "编辑",
    status: "active",
    age: 28,
  },
];

const columns: ColumnType<UserData>[] = [
  { title: "姓名", dataIndex: "name", key: "name", sorter: true },
  { title: "邮箱", dataIndex: "email", key: "email", ellipsis: true },
  { title: "角色", dataIndex: "role", key: "role", align: "center" },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    align: "center",
    render: (value) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs ${
          value === "active"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        }`}
      >
        {value === "active" ? "启用" : "禁用"}
      </span>
    ),
  },
  {
    title: "操作",
    key: "action",
    align: "center",
    render: () => (
      <div className="flex items-center justify-center gap-2">
        <Button size="sm" variant="ghost" icon={<BiEdit size={14} />} />
        <Button
          size="sm"
          variant="ghost"
          icon={<BiTrash size={14} />}
          className="text-red-600 hover:text-red-700"
        />
      </div>
    ),
  },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function ComponentsDemo() {
  const [switchChecked, setSwitchChecked] = useState(true);
  const [sliderValue, setSliderValue] = useState(50);
  const [radioValue, setRadioValue] = useState<string | number>("option1");
  const [checkboxValues, setCheckboxValues] = useState<(string | number)[]>(["option1"]);
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [tablePage, setTablePage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(["1", "2"]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">组件库展示</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            所有基础组件的统一风格展示
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Button 按钮 */}
        <Section title="Button 按钮">
          <div className="flex flex-wrap gap-3">
            <Button>主要按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="outline">描边按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button variant="danger">危险按钮</Button>
            <Button variant="link">链接按钮</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">小按钮</Button>
            <Button size="md">中按钮</Button>
            <Button size="lg">大按钮</Button>
            <Button loading>加载中</Button>
            <Button icon={<BiPlus size={16} />}>添加</Button>
            <Button shape="circle" icon={<BiSearch size={18} />} />
          </div>
        </Section>

        {/* Input 输入框 */}
        <Section title="Input 输入框">
          <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder="基础输入框"
              value={inputValue}
              onChange={(value) => setInputValue(value)}
            />
            <Input placeholder="带前缀图标" prefixIcon={<BiUser size={18} />} />
            <Input placeholder="密码输入" type="password" />
            <Input placeholder="禁用状态" disabled />
            <Input label="带标签" placeholder="请输入" />
            <Input placeholder="错误状态" error errorMessage="请输入正确的内容" />
            <Input placeholder="默认尺寸" size="md" />
            <Input placeholder="小尺寸" size="sm" />
            <Input placeholder="大尺寸" size="lg" />
          </div>
        </Section>

        {/* Select 选择器 */}
        <Section title="Select 选择器">
          <div className="max-w-md space-y-4">
            <Select
              label="基础选择"
              placeholder="请选择"
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { value: "1", label: "选项一" },
                { value: "2", label: "选项二" },
                { value: "3", label: "选项三" },
              ]}
            />
            <Select
              placeholder="可清除"
              allowClear
              options={[
                { value: "a", label: "选项 A" },
                { value: "b", label: "选项 B" },
              ]}
            />
          </div>
        </Section>

        {/* Switch 开关 */}
        <Section title="Switch 开关">
          <div className="flex flex-wrap items-center gap-6">
            <Switch checked={switchChecked} onChange={setSwitchChecked} label="基础开关" />
            <Switch checked={switchChecked} onChange={setSwitchChecked} size="sm" label="小开关" />
            <Switch checked={switchChecked} onChange={setSwitchChecked} size="lg" label="大开关" />
            <Switch disabled label="禁用" />
            <Switch
              checked={switchChecked}
              onChange={setSwitchChecked}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>
        </Section>

        {/* Slider 滑块 */}
        <Section title="Slider 滑动输入条">
          <div className="max-w-xl space-y-6">
            <Slider
              value={sliderValue}
              onChange={setSliderValue}
              label={`当前值: ${sliderValue}`}
            />
            <Slider
              min={0}
              max={100}
              step={10}
              showInput
              showTicks
              marks={{ 0: "0%", 50: "50%", 100: "100%" }}
            />
          </div>
        </Section>

        {/* Radio 单选框 */}
        <Section title="Radio 单选框">
          <div className="space-y-4">
            <RadioGroup
              value={radioValue}
              onChange={setRadioValue}
              options={[
                { label: "选项一", value: "option1" },
                { label: "选项二", value: "option2" },
                { label: "选项三（禁用）", value: "option3", disabled: true },
              ]}
            />
            <RadioGroup
              value={radioValue}
              onChange={setRadioValue}
              optionType="button"
              options={[
                { label: "日", value: "day" },
                { label: "周", value: "week" },
                { label: "月", value: "month" },
                { label: "年", value: "year" },
              ]}
            />
          </div>
        </Section>

        {/* Checkbox 多选框 */}
        <Section title="Checkbox 多选框">
          <div className="space-y-4">
            <CheckboxGroup
              value={checkboxValues}
              onChange={setCheckboxValues}
              options={[
                { label: "选项一", value: "option1" },
                { label: "选项二", value: "option2" },
                { label: "选项三", value: "option3" },
              ]}
            />
            <div className="flex gap-4">
              <Checkbox checked>已选中</Checkbox>
              <Checkbox indeterminate>半选状态</Checkbox>
              <Checkbox disabled>禁用</Checkbox>
            </div>
          </div>
        </Section>

        {/* Card 卡片 */}
        <Section title="Card 卡片">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              title="基础卡片"
              extra={
                <Button size="sm" variant="ghost">
                  更多
                </Button>
              }
            >
              <p className="text-gray-600 dark:text-gray-400">
                这是卡片的内容区域，可以放置任何内容。
              </p>
            </Card>
            <Card hoverable>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                  <BiUser size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    用户信息
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    包含头像、标题和描述的元信息卡片
                  </div>
                </div>
              </div>
            </Card>
            <Card
              title="带操作"
              actions={[<span key="1">操作一</span>, <span key="2">操作二</span>]}
            >
              <p className="text-gray-600 dark:text-gray-400">底部有操作按钮的卡片</p>
            </Card>
          </div>
        </Section>

        {/* Tabs 标签页 */}
        <Section title="Tabs 标签页">
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="line"
              items={[
                {
                  key: "1",
                  label: "基础信息",
                  children: (
                    <div className="p-4 text-gray-600 dark:text-gray-400">基础信息内容</div>
                  ),
                },
                {
                  key: "2",
                  label: "详细设置",
                  children: (
                    <div className="p-4 text-gray-600 dark:text-gray-400">详细设置内容</div>
                  ),
                },
                {
                  key: "3",
                  label: "安全选项",
                  children: (
                    <div className="p-4 text-gray-600 dark:text-gray-400">安全选项内容</div>
                  ),
                },
              ]}
            />
          </Card>
        </Section>

        {/* Tree 树形控件 */}
        <Section title="Tree 树形控件">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card title="基础树形">
              <Tree
                treeData={treeData}
                selectedKeys={selectedKeys}
                onSelect={(keys) => setSelectedKeys(keys)}
                defaultExpandAll
              />
            </Card>
            <Card title="带复选框">
              <Tree
                treeData={treeData}
                checkable
                checkedKeys={checkedKeys}
                onCheck={(keys) => setCheckedKeys(keys)}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
              />
            </Card>
          </div>
        </Section>

        {/* List 列表 */}
        <Section title="List 列表">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <List
              header="用户列表"
              bordered
              rounded
              dataSource={[
                {
                  title: "张三",
                  description: "zhangsan@example.com",
                  avatar: <BiUser size={20} />,
                  arrow: true,
                },
                {
                  title: "李四",
                  description: "lisi@example.com",
                  avatar: <BiUser size={20} />,
                  arrow: true,
                },
                {
                  title: "王五",
                  description: "wangwu@example.com",
                  avatar: <BiUser size={20} />,
                  arrow: true,
                },
              ]}
            />
            <List bordered rounded>
              <List.Item
                title="通知消息"
                description="您有一条新的系统通知"
                prefix={<BiEnvelope className="text-blue-500" size={24} />}
                extra={<span className="text-xs text-gray-400">2分钟前</span>}
              />
              <List.Item
                title="收藏更新"
                description="您收藏的内容有更新"
                prefix={<BiHeart className="text-red-500" size={24} />}
                extra={<span className="text-xs text-gray-400">1小时前</span>}
              />
              <List.Item
                title="评分提醒"
                description="请为最近的服务评分"
                prefix={<BiStar className="text-yellow-500" size={24} />}
                extra={<span className="text-xs text-gray-400">昨天</span>}
              />
            </List>
          </div>
        </Section>

        {/* Table 表格 */}
        <Section title="Table 表格">
          <Card>
            <Table
              columns={columns}
              dataSource={mockData}
              bordered
              striped
              rowKey="id"
              pagination={{
                current: tablePage,
                pageSize: 5,
                total: mockData.length,
                onChange: (page) => setTablePage(page),
              }}
            />
          </Card>
        </Section>

        {/* Form 表单 */}
        <Section title="Form 表单">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 垂直布局表单 */}
            <Card title="用户注册（垂直布局）">
              <Form
                onFinish={(values) => {
                  alert("表单提交：" + JSON.stringify(values, null, 2));
                }}
                onFinishFailed={(errors) => {
                  console.log("验证失败：", errors);
                }}
              >
                <FormItem
                  name="username"
                  label="用户名"
                  required
                  rules={[{ min: 3, message: "用户名至少3个字符" }]}
                >
                  <Input placeholder="请输入用户名" prefixIcon={<BiUser size={18} />} />
                </FormItem>
                <FormItem
                  name="email"
                  label="邮箱"
                  required
                  rules={[
                    {
                      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "请输入有效的邮箱地址",
                    },
                  ]}
                >
                  <Input placeholder="请输入邮箱" prefixIcon={<BiEnvelope size={18} />} />
                </FormItem>
                <FormItem name="role" label="角色">
                  <Select
                    placeholder="请选择角色"
                    options={[
                      { value: "admin", label: "管理员" },
                      { value: "editor", label: "编辑" },
                      { value: "user", label: "普通用户" },
                    ]}
                  />
                </FormItem>
                <FormItem name="agreement">
                  <Checkbox
                    checked={checkboxValues.includes("agreement")}
                    onChange={(checked) => {
                      if (checked) {
                        setCheckboxValues([...checkboxValues, "agreement"]);
                      } else {
                        setCheckboxValues(checkboxValues.filter((v) => v !== "agreement"));
                      }
                    }}
                  >
                    我已阅读并同意用户协议
                  </Checkbox>
                </FormItem>
                <FormItem>
                  <div className="flex gap-3">
                    <Button type="submit">提交</Button>
                    <Button type="reset" variant="secondary">
                      重置
                    </Button>
                  </div>
                </FormItem>
              </Form>
            </Card>

            {/* 水平布局表单 */}
            <Card title="系统设置（水平布局）">
              <Form layout="horizontal" labelWidth={100}>
                <FormItem name="siteName" label="站点名称">
                  <Input placeholder="请输入站点名称" />
                </FormItem>
                <FormItem name="notification" label="开启通知">
                  <Switch checked={switchChecked} onChange={setSwitchChecked} />
                </FormItem>
                <FormItem name="theme" label="主题风格">
                  <RadioGroup
                    value={radioValue}
                    onChange={setRadioValue}
                    optionType="button"
                    options={[
                      { label: "浅色", value: "light" },
                      { label: "深色", value: "dark" },
                      { label: "自动", value: "auto" },
                    ]}
                  />
                </FormItem>
                <FormItem name="features" label="功能模块">
                  <CheckboxGroup
                    value={checkboxValues}
                    onChange={setCheckboxValues}
                    options={[
                      { label: "评论", value: "comment" },
                      { label: "分享", value: "share" },
                      { label: "收藏", value: "favorite" },
                    ]}
                  />
                </FormItem>
                <FormItem name="volume" label="系统音量">
                  <Slider value={sliderValue} onChange={setSliderValue} showInput />
                </FormItem>
                <FormItem>
                  <div className="ml-[100px] flex gap-3">
                    <Button type="submit">保存设置</Button>
                    <Button variant="ghost">恢复默认</Button>
                  </div>
                </FormItem>
              </Form>
            </Card>
          </div>
        </Section>

        {/* Modal & Drawer 弹窗/抽屉 */}
        <Section title="Modal & Drawer 弹窗与抽屉">
          <div className="flex gap-3">
            <Button onClick={() => setModalOpen(true)}>打开弹窗</Button>
            <Button onClick={() => setDrawerOpen(true)} variant="secondary">
              打开抽屉
            </Button>
          </div>
        </Section>
      </main>

      {/* Modal 弹窗 */}
      <Modal
        open={modalOpen}
        title="确认操作"
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          setModalOpen(false);
        }}
        type="confirm"
      >
        <p className="text-gray-600 dark:text-gray-400">这是一个确认对话框，用于确认用户的操作。</p>
      </Modal>

      {/* Drawer 抽屉 */}
      <Drawer
        open={drawerOpen}
        title="设置面板"
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setDrawerOpen(false)}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              用户名
            </label>
            <Input placeholder="请输入用户名" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              邮箱
            </label>
            <Input placeholder="请输入邮箱" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              启用通知
            </label>
            <Switch checked={switchChecked} onChange={setSwitchChecked} />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
