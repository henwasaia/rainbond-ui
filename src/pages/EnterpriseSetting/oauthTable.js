/* eslint-disable camelcase */
/* eslint-disable prefer-const */
/*
  挂载共享目录组件
*/
import { Button, Col, Modal, notification, Row, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import styles from '../../components/CreateTeam/index.less';
import OauthForm from '../../components/OauthForm';

const { confirm } = Modal;

@connect(({ loading, global, index }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class OauthTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      oauthVisible: false,
      oauthList: [],
      oauthInfo: false,
      oauthTable: [],
      openOauth: false,
      isOpen: false,
      showDeleteDomain: false,
    };
  }
  componentDidMount() {
    this.handelOauthInfo();
  }

  handleSubmit = () => {
    const { onOk } = this.props;
    onOk && onOk();
  };
  handleCreate = () => {
    this.setState({
      oauthVisible: true,
    });
  };

  handleDiv = data => {
    return (
      <Tooltip title={data}>
        <span
          style={{
            wordBreak: 'break-all',
            wordWrap: 'break-word',
          }}
        >
          {data}
        </span>
      </Tooltip>
    );
  };

  handleDel = record => {
    const _th = this;
    confirm({
      title: '删除配置后已绑定的用户数据将清除',
      content: '确定要删除此配置吗？',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        _th.handleDeleteOauth(record);
      },
    });
  };

  handleDeleteOauth = data => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/deleteOauthInfo',
      payload: {
        service_id: data.service_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          notification.success({ message: '删除成功' });
          this.handelOauthInfo();
        }
      },
    });
  };

  handleCreatOauth = values => {
    let {
      name,
      client_id,
      client_secret,
      oauth_type,
      home_url,
      redirect_domain,
    } = values;
    oauth_type = oauth_type.toLowerCase();
    if (oauth_type === 'github') {
      home_url = 'https://github.com';
    }
    const obj = {
      name,
      client_id,
      client_secret,
      is_auto_login: false,
      oauth_type,
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      home_url,
      is_console: true,
    };
    this.handelRequest(obj);
  };
  handelRequest = (obj = {}, isclone) => {
    const { dispatch, eid } = this.props;
    const { oauthInfo, oauthTable, isOpen } = this.state;
    const arr = [...oauthTable];
    obj.eid = eid;
    oauthInfo
      ? (obj.service_id = oauthInfo.service_id)
      : (obj.service_id = null);
    isclone ? (obj.enable = false) : (obj.enable = true);

    if (oauthTable && oauthTable.length > 0) {
      oauthTable.map((item, index) => {
        const { service_id } = item;
        arr[index].is_console = true;
        if (oauthInfo && service_id === obj.service_id) {
          arr[index] = Object.assign(arr[index], obj);
        }
      });
    }
    !oauthInfo && arr.push(obj);
    dispatch({
      type: 'global/creatOauth',
      payload: {
        enterprise_id: eid,
        arr,
      },
      callback: data => {
        if (data && data._code === 200) {
          notification.success({
            message: isOpen
              ? '开启成功'
              : isclone
              ? '关闭成功'
              : oauthInfo
              ? '编辑成功'
              : '添加成功',
          });
          this.handelOauthInfo();
        }
      },
    });
  };

  handleOpen = (oauthInfo, isOpen) => {
    this.setState({
      openOauth: true,
      oauthInfo,
      isOpen,
    });
  };

  handleOpenDomain = oauthInfo => {
    this.setState({
      oauthInfo,
      showDeleteDomain: true,
    });
  };

  handelClone = () => {
    this.setState({
      isOpen: false,
      openOauth: false,
      oauthInfo: false,
      showDeleteDomain: false,
    });
  };
  handelOauthInfo = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'global/getOauthInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code == 200) {
          const lists = res.list && res.list.length > 0 && res.list;
          this.setState({
            loading: false,
            oauthTable: lists || [],
          });
          this.handelClone();
        }
      },
    });
  };
  render() {
    const { onCancel, oauthLongin } = this.props;
    const {
      oauthTable,
      loading,
      openOauth,
      oauthInfo,
      showDeleteDomain,
    } = this.state;
    return (
      <Modal
        title="OAuth服务配置"
        loading={loading}
        className={styles.TelescopicModal}
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button style={{ marginTop: '20px' }} onClick={this.handleSubmit}>
            关闭
          </Button>,
        ]}
      >
        <div>
          {showDeleteDomain && (
            <ConfirmModal
              loading={oauthLongin}
              title="关闭"
              desc="确定要关闭此配置吗？"
              onOk={() => {
                this.handelRequest(oauthInfo, 'clone');
              }}
              onCancel={this.handelClone}
            />
          )}
          {openOauth && (
            <OauthForm
              loading={oauthLongin}
              oauthInfo={oauthInfo}
              onOk={this.handleCreatOauth}
              onCancel={this.handelClone}
            />
          )}

          <Row gutter={12}>
            <Col span={24} style={{ textAlign: 'right', marginBottom: '10px' }}>
              <Button
                onClick={() => {
                  this.handleOpen(false);
                }}
                type="primary"
                icon="plus"
              >
                添加
              </Button>
            </Col>
          </Row>
          <Table
            dataSource={oauthTable}
            style={{ width: '100%', overflowX: 'auto' }}
            columns={[
              {
                title: 'OAuth类型',
                dataIndex: 'oauth_type',
                key: '1',
                width: '10%',
              },
              {
                title: '名称',
                dataIndex: 'name',
                key: '2',
                width: '15%',
              },
              {
                title: '客户端ID',
                dataIndex: 'client_id',
                key: '3',
                width: '15%',
                render: data => this.handleDiv(data),
              },
              {
                title: '客户端密钥',
                dataIndex: 'client_secret',
                key: '4',
                width: '15%',
                render: data => this.handleDiv(data),
              },
              {
                title: '服务地址',
                dataIndex: 'home_url',
                key: '5',
                width: '15%',
                render: data => this.handleDiv(data),
              },
              {
                title: '操作',
                dataIndex: 'action',
                width: '15%',
                key: 'action',
                align: 'center',
                render: (_data, record) => (
                  <div>
                    <a
                      style={{ marginRight: '10px' }}
                      onClick={() => {
                        this.handleDel(record);
                      }}
                    >
                      删除
                    </a>
                    <a
                      style={{ marginRight: '10px' }}
                      onClick={() => {
                        this.handleOpen(record);
                      }}
                    >
                      编辑
                    </a>
                    <a
                      onClick={() => {
                        record.enable
                          ? this.handleOpenDomain(record)
                          : this.handleOpen(record, true);
                      }}
                    >
                      {record.enable ? '关闭' : '开启'}
                    </a>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    );
  }
}
